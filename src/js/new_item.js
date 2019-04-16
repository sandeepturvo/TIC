const ETHEREUM_NETWORK_URL = "http://35.232.246.167:7545";

$(function () {
    const App = {
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
                }
            });
        },

        saveItem: function () {
            var name = $("#itemName").val();
            App.contracts.Item.new(name).then(function (instance) {
                window.location.href = '/item_detail.html?address=' + instance.address;
            });

        }
    };

    $("#createButton").on("click", function () {
        App.saveItem();
    });

    $(window).load(function () {
        App.init();

    });
    $(document).ready(function () {
        $('.fixed-action-btn').floatingActionButton();
    });
});