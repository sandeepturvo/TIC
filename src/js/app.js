var id = 1;
var items = [];

var $itemList = $("#item-list");
var $itemTimeline = $("#item-timeline");

function showItem(item) {

    const qrCodeId = `qr-code-${item.address}`;
    const text = item.address;
    //var itemDate = new Date(parseInt(item.date.toString())*1000);
    const date =  moment.unix(parseInt(item.date.toString())).format('YYYY-MM-DD HH:mm:ss');// Date.parse(itemDate).toString('yyyy-MM-dd H:i:s')

   var itemSnip = `<div class="col-sm-2 item-card">
                            <div class="card">
                                <div class="card-img-qr" id="qr-code-${item.address}"></div>
                                <div class="card-body">
                                    <h4 class="card-title">${item.name}</h4>
                                    <p class="card-text">${item.address}</p>
                                     <p class="card-text">${date}</p>
                                    
                                </div>
                            </div>
                        </div>`;
    console.log(itemSnip);
    $itemList.append(itemSnip);
    console.log(qrCodeId);

    // $itemList.append(itemSnip,function(index,html){
    //     console.log(id);
    //     new QRCode(document.getElementById(id), {
    //                       text,
    //                       width: 220,
    //                       height: 220,
    //                       colorDark: "#000000",
    //                       colorLight: "#ffffff",
    //                       correctLevel: QRCode.CorrectLevel.H
    //                   });
    // })
     new QRCode(document.getElementById(qrCodeId), {
                          text,
                          width: 220,
                          height: 220,
                          colorDark: "#000000",
                          colorLight: "#ffffff",
                          correctLevel: QRCode.CorrectLevel.H
                      });
    
}


function createItemCard(item){

    var $itemRes = $("#item-res");
    $itemRes.empty();
    const date =  moment.unix(parseInt(item.date.toString())).format('YYYY-MM-DD HH:mm:ss');// Date.parse(itemDate).toString('yyyy-MM-dd H:i:s')

     const itemHtml = `<div class="card-body">
                                    <h5 class="card-title">${item.name}</h5>

                                </div>
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item">
                                        <table>
                                            <tr>
                                                <td>Address</td>
                                                <td>${item.address}</td>
                                            </tr>

                                        </table>
                                    </li>
                                    <li class="list-group-item">
                                        <table>
                                            <tr>
                                                <td>Date</td>
                                                <td>${date}</td>
                                            </tr>

                                        </table>
                                    </li>
                                     <li class="list-group-item">
                                        <table>
                                            <tr>
                                                <td>Manufacturer</td>
                                                <td>${item.manufacturer}</td>
                                            </tr>

                                        </table>
                                    </li>

                                </ul>`;

   $itemRes.append(itemHtml);
}

function createTimeLine(trace){
    console.log(trace);
     date =  moment.unix(parseInt(trace.date.toString())).format('YYYY-MM-DD HH:mm:ss');
    const traceHtml = `<div class="entry">
                                            <div class="title">
                                                <h3>${date}</h3>
                                            </div>
                                            <div class="body">
                                                <p>${trace.owner}</p>

                                            </div>
                                        </div>`;
    $itemTimeline.append(traceHtml);                                    
}

App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    hasVoted: false,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        // TODO: refactor conditional
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("AccountDatabase.json", function (accountDatabase) {
            App.contracts.AccountDatabase = TruffleContract(accountDatabase);
            App.contracts.AccountDatabase.setProvider(App.web3Provider);
            App.contracts.AccountDatabase.at("0x3cae13001c74798BD7e99280e00b7fd5DdDA7C18").then(function (instance) {
                instance.findItems()
                    .then(function (items) {
                        var accountItems = items[1];
                        console.log(accountItems);
                        $itemList.empty();
                        $.getJSON("Item.json", function (item) {
                            // Instantiate a new truffle contract from the artifact
                            App.contracts.Item = TruffleContract(item);
                            // Connect provider to interact with contract
                            App.contracts.Item.setProvider(App.web3Provider);

                            for (var i = 0; i < accountItems.length; i++) {
                                var address = accountItems[i];
                                var index = i;
                                App.contracts.Item.at(address).then(function (instance) {

                                    var namePromise = instance.name();
                                    var datePromise = namePromise.then(function(name) {
                                        return instance.createdDate();
                                    });
                                    Promise.all([namePromise, datePromise]).then(function([name, date]) {
                                        showItem({
                                            name: name,
                                            address: instance.address,
                                            date,
                                            
                                        });
                                    });


                                    // instance.name().then(function (name) {
                                    //     console.log(name);
                                    //     showItem({
                                    //         name: name,
                                    //         address: instance.address
                                            
                                            
                                    //     });
                                    // });
                                });
                            }

                            return App.render();
                        });
                    });
            });
        });
    },

    render: function () {
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your Account: " + account);
            }
        });

        // Load contract data
        App.contracts.AccountDatabase.deployed().then(function (instance) {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();
            return true;
        }).then(function (hasVoted) {
            // Do not allow a user to vote
            if (hasVoted) {
                $('#castForm').hide();
            }
            loader.hide();
            content.show();
        }).catch(function (error) {
            console.warn(error);
        });
    },

    searchItem: function (address) {
       
        App.contracts.Item.at(address).then(function (instance) {

            var namePromise = instance.name();
            var datePromise = namePromise.then(function(name) {
                return instance.createdDate();
            });
            var manufacturerPromise = instance.manufacturer();
            var ownerShipTracePromise = instance.getOwnershipTrace();                        
            Promise.all([namePromise, datePromise, manufacturerPromise, ownerShipTracePromise]).then(function([name, date, manufacturer, ownerShipTrace]) {
                // console.log(ownerShipTrace.toString());
                console.log(ownerShipTrace);
                 let traceParts = ownerShipTrace.toString().split(',');
                createItemCard({
                    name,
                    date,
                    manufacturer,
                    address: instance.address
                });


                let count = parseInt(ownerShipTrace[0]);
                let owners = ownerShipTrace[1];
                let dates = ownerShipTrace[2];
                let modes = ownerShipTrace[3];
                let comments = ownerShipTrace[4].split('###');
                $itemTimeline.empty();
                for(var i=0;i< count;i++){
                    createTimeLine({owner: owners[i], date: dates[i], mode: modes[i], comment: comments[i]})
                }

            });
        });

    },
    saveItem: function () {
        var name = $("#itemName").val();
        App.contracts.Item.new(name).then(function (instance) {
            items.push({
                id: id++,
                name: name,
                address: instance.address
            });
            showItem(items[items.length - 1]);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
        
    });
    $(document).ready(function () {
        $('.fixed-action-btn').floatingActionButton();
    });

     let scanner = new Instascan.Scanner({
            video: document.getElementById('preview')
        });
        scanner.addListener('scan', function (content, image) {
            console.log(content);
           App.searchItem(content);
        });
        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                scanner.start(cameras[0]);
            } else {
                console.error('No cameras found.');
            }
        }).catch(function (e) {
            console.error(e);
        });

});