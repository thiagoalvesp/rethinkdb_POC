r = require('rethinkdb');

var conexao = null;
var interval = 2000;

r.connect({
    host: 'localhost',
    port: 28015
}).then(function (conn) {
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
