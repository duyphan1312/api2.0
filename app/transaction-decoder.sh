# export CORE_PEER_LOCALMSPID="Org1MSP"
# export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/channel/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
# export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/channel/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
# export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
# export CHANNEL_NAME="mychannel"
# export CC_NAME="qscc"
# export ORDERER_CA=/etc/hyperledger/channel/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
# export VERSION="1"
configtxlator proto_decode --input ./app/data/transactionData.block --type protos.ProcessedTransaction >./app/data/transaction.json