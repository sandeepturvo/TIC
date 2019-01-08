$(function () {
    var $itemTimeline = $("#item-timeline");

    var loading;

    function createItemCard(item){

        var $itemRes = $("#item-res");
        $itemRes.empty();
        const date =  moment.unix(parseInt(item.date.toString())).format('YYYY-MM-DD HH:mm:ss');// Date.parse(itemDate).toString('yyyy-MM-dd H:i:s')

        const itemHtml = `<div class="card-body">
                                <div id="qr-code"></div>
                                    <h5 id="card-title" class="card-title">${item.name}</h5>

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

        new QRCode(document.getElementById("qr-code"), {
            text: item.address,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
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
                                                <p>${trace.comment}</p>

                                            </div>
                                        </div>`;
        $itemTimeline.append(traceHtml);
    }

    App = {
        web3Provider: null,
        contracts: {},
        account: '0x0',

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
            $.getJSON("Item.json", function (item) {
                // Instantiate a new truffle contract from the artifact
                App.contracts.Item = TruffleContract(item);
                // Connect provider to interact with contract
                App.contracts.Item.setProvider(App.web3Provider);

                return App.render();
            });
        },

        render: function () {
            // Load account data
            web3.eth.getCoinbase(function (err, account) {
                if (err === null) {
                    App.account = account;
                    $("#accountAddress").html("Your Account: " + account);
                }
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
                    $("#item-details").css("opacity", "100");
                    loading.out();
                });
            });

        }
    };

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
        loading = new Loading();
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