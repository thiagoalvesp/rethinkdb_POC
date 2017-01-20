r = require('rethinkdb');
var conexao = null;

r.connect({
    host: 'localhost',
    port: 28015
})
.then(function(conn){

    console.log('Conectado no Rethink!');
    //guardo a conexão para usar futuramente 
    conexao = conn;


    //Se conectou eu crio o banco - Quando Crio a Tabela ele já Cria o banco
    r.dbCreate('banco').run(conexao)
        .then(function (dbCreated) {
            console.log('Banco Criado!');
        }).catch(function(err){
             console.log('Erro na Criação do Banco de Dados! \n %s', err);
        });

    //tabela
    r.db('banco').tableCreate('documentos').run(conexao)
        .then(function (tbCreated) {
            console.log('Tabela Criada!');
        })
        .catch(function(err){
             console.log('Erro na Criação da Tabela! \n %s', err);
        });

})
.then(function(){
    setInterval(populaBancoParaTeste, 1000);
})
.catch(function (err) {
    console.log('Falha ao conectar no Rethink: %s', err);
})


var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);
io.on('connection',function(socket) {

    r.db('banco').table('documentos').changes().run(conexao)
    .then(function(cursor){
        cursor.each(function(err,row){
            console.log(JSON.stringify(row));
            if(Object.keys(row).length > 0) {
                socket.broadcast.emit("changeFeed",
                    {"id" : row.new_val.id, 
                     "valor1": row.new_val.valor1,
                     "valor2": row.new_val.valor2,
                     "valor3": row.new_val.valor3}
                );
            }
        })
    }).catch(function(err){
        console.log('Falha ao abrir o cursor no Rethink: %s', err);
    });

});

app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));
//rota
app.get('/',function(req,res){
    res.render('index');
});

//view
app.set('view engine', 'ejs');
app.set('views',__dirname+'/public');

http.listen(3000,function(){
    console.log('Servidor ouvindo na porta 3000');
})

//Dropar o banco quando parar o servidor
process.on('SIGINT', function () {

    r.dbDrop('banco').run(conexao)
        .catch(function (err) {
            console.log('Falha ao excluir o banco no Rethink: %s', err);
            process.exit();
        });

    console.log('Limpeza Realizada!')

    process.exit();

});

function populaBancoParaTeste(){

    //registros para utilizar no teste
    r.db('banco').table('documentos').insert({
            data: new Date(),
            valor1: Math.random() * 100, 
            valor2: Math.random() * 75,
            valor3: Math.random() * 50
        }).run(conexao).then(function (inserted) {
            console.log(inserted);
        }).catch(function (err) {
            console.log('Erro no Insert! \n %s', err);
        });

}