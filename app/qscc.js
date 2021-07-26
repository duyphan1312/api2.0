const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')
// const { QSCCProposal } = require('khala-fabric-admin')
const { BlockDecoder } = require('fabric-common');
// const blockDecoder = require('./BlockDecoder')
// const stream = require('stream');
var Docker = require('dockerode');
var socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
var stats  = fs.statSync(socket);
//remember to update the CLI container's ID
const cliContainerID = '15054aab0d1d'
// const os = require('os');//for getting current container id

const helper = require('./helper');


// function containerLogs(container) {

//     // create a single stream for stdin and stdout
//     var logStream = new stream.PassThrough();
//     logStream.on('data', function(chunk){
//       console.log(chunk.toString('utf8'));
//     });
  
//     container.logs({
//       follow: true,
//       stdout: true,
//       stderr: true
//     }, function(err, stream){
//       if(err) {
//         return logger.error(err.message);
//       }
//       container.modem.demuxStream(stream, logStream, logStream);
//       stream.on('end', function(){
//         logStream.end('!stop!');
//       });
  
//       setTimeout(function() {
//         stream.destroy();
//       }, 2000);
//     });
//   }


const qscc = async (channelName, chaincodeName, args, fcn, username, org_name) => {

    try {

        // load the network configuration
        // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: false }
        });

        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);
        let result;
        // await gateway.connect(ccp, {
        //      wallet, identity: username, discovery: {"enabled": true,"asLocalhost": true} 
        // });
        if (fcn == 'GetBlockByNumber') {
            result = await contract.evaluateTransaction(fcn, channelName, args[0]);

            // const fs = require('fs')
            // fs.writeFileSync('./app/data/blockData.block', result)

            // let runScript = () => new Promise((resolve, reject) => {
            //     const { exec } = require('child_process');
            //     exec('sh ./app/block-decoder.sh',
            //         (error, stdout, stderr) => {
            //             console.log(stdout);
            //             console.log(stderr);
            //             if (error !== null) {
            //                 console.log(`exec error: ${error}`);
            //                 reject(false)
            //             } else {
            //                 resolve(true)
            //             }
            //         });
            // })

            // result = await runScript()
            // result = fs.readFileSync('./app/data/block.json')

            // result = JSON.parse(result.toString('utf-8'))
            result = BlockDecoder.decode(result);
        } else if (fcn == "GetTransactionByID") {
            result = await contract.evaluateTransaction(fcn, channelName, args[0]);

            

            // const fs = require('fs')
            // fs.writeFileSync('./app/data/transactionData.block', result)

            // let runScript = () => new Promise((resolve, reject) => {
            //     const { exec } = require('child_process');
                
            //     exec('sh ./app/transaction-decoder.sh',
                    
            //         (error, stdout, stderr) => {
            //             console.log(stdout);
            //             console.log(stderr);
            //             if (error !== null) {
            //                 console.log(`exec error: ${error}`);
            //                 reject(false)
            //             } else {
            //                 resolve(true)
            //             }
            //         });
            // })

            // result = await runScript()
            // result = fs.readFileSync('./app/data/transaction.json')

            // result = JSON.parse(result)

            result = BlockDecoder.decodeTransaction(result);
            // let decoder = new BlockDecoder()
            // console.log("Decoder is ", decoder)
            // result =  blockDecoder.decodeTransaction(result)
            // console.log("decoder block is :", result)
        } else if (fcn == "GetChainInfo") {
            if (!stats.isSocket()) {
                throw new Error('Are you sure the docker is running?');
                }
            var docker = new Docker({ socketPath: socket });
            // docker.listContainers({all: true}, function(err, containers) {//worked
            // console.log('ALL: ' + containers.length);
            // });
            //need to update current cli container 's ID here
            var container = docker.getContainer(cliContainerID);//get inside the cli container
            // var currentContainer = docker.getContainer(os.hostname());//current container
            // query API for container info
            container.inspect(function (err, data) {//worked
            console.log('container info : ',data);
            });
            //worked from here------------------------------------------------------------------
            let params = {
                // Cmd: [
                //   'sh',
                //   // '-c',
                //   './getChannelInfo.sh'],
                  Cmd: [
                    'sh',
                    '-c',
                    'peer channel getinfo -c mychannel >> ./containerLogs.txt 2>&1'],
                // Env: ['URL=/home'],
                AttachStdout: true,
                AttachStderr: true,
            }
           
            container.exec(params, function(err, exec) {//query qscc chaincode info
                if (err) return;
                exec.start(function(err, stream) {
                    if (err) return;  
                                  
                    container.modem.demuxStream(stream, process.stdout, process.stderr);
                     console.log('peer command excuted.')
                    
                    exec.inspect(function(err, data) {
                        if (err) return;
                        
                        
                        // result = JSON.parse(JSON.stringify(data));
                   });
                });
            });
            await new Promise(resolve => setTimeout(resolve, 500));//delay 500ms for the volume synchronization
            //-- to here-----------------------------------------------------------
            
            const fs = require('fs') 

            let runScript = () => new Promise((resolve, reject) => {
                const { exec } = require('child_process');
                
                exec('tail -1 ./share/containerLogs.txt',
                // exec('ls -l',                   
                    (error, stdout, stderr) => {
                        console.log('-------Child process excuted. Output: ', stdout);
                        result = stdout.substr(17,stdout.length)
                        console.log(stderr);
                        if (error !== null) {
                            console.log(`exec error: ${error}`);
                            reject(false)
                        } else {
                            resolve(true)
                        }
                    });
            })
            console.log('---------Result await runScript(): ' )
            await runScript()
            result = JSON.parse(JSON.stringify(result))

            
        }

        return result
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return error.message
    }
}

exports.qscc = qscc