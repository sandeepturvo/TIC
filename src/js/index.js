const ACCOUNT_DATABASE_ADDR = "0x74444C982F8e90b6036b3043EA6fA206D2c7D0f6";
const ETHEREUM_NETWORK_URL = "http://35.232.246.167:7545";

var id = 1;
var items = [];

var $itemList = $("#item-list"); 

function showItem(item) {

    const qrCodeId = `qr-code-${item.address}`;
    const text = item.address;
    const date =  moment.unix(parseInt(item.date.toString())).format('YYYY-MM-DD HH:mm:ss');

    var $itemSnip = $(`<div class="col-sm-4 item-card">
                            <div class="card">
                                <div class="card-img-qr" id="qr-code-${item.address}"></div>
                                <div class="card-body">
                                    <h4 class="card-title">${item.name}</h4>
                                    <p class="card-text">${item.address}</p>
                                     <p class="card-text">${date}</p>
                                    
                                </div>
                            </div>
                        </div>`);
    $itemList.append($itemSnip);
    $itemSnip.on('click', function () {
        window.location.href = '/item_detail.html?address=' + item.address;
    });
    $itemSnip.css('cursor', 'pointer');

    new QRCode(document.getElementById(qrCodeId), {
        text,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

}

var loading = new Loading();

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
            App.web3Provider = new Web3.providers.HttpProvider(ETHEREUM_NETWORK_URL);
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("AccountDatabase.json", function (accountDatabase) {
            App.contracts.AccountDatabase = TruffleContract(accountDatabase);
            App.contracts.AccountDatabase.setProvider(App.web3Provider);
            App.contracts.AccountDatabase.at(ACCOUNT_DATABASE_ADDR).then(function (instance) {
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

                            var countItemsDisplayed = 0;
                            if (accountItems.length === 0) {
                                loading.out();
                            }
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
                                        countItemsDisplayed++;
                                        if (countItemsDisplayed === accountItems.length) {
                                            loading.out();
                                        }
                                    });
                                });
                            }
                            return App.render();
                        });
                    });
            });
        });
    },

    render: function () {
        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
            }
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
});