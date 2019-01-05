var id = 1;
var items = [];

var $candidatesResults = $("#candidatesResults");

function showItem(item) {
    var candidateTemplate = "<tr><td>" + item.name + "</td><td>" + item.address + "</td></tr>";
    $candidatesResults.append(candidateTemplate);
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
            App.contracts.AccountDatabase.deployed().then(function (instance) {
                instance.findItems()
                    .then(function (items) {
                        var accountItems = items[1];
                        $.getJSON("Item.json", function (item) {
                            // Instantiate a new truffle contract from the artifact
                            App.contracts.Item = TruffleContract(item);
                            // Connect provider to interact with contract
                            App.contracts.Item.setProvider(App.web3Provider);

                            for (var i = 0; i < accountItems.length; i++) {
                                var address = accountItems[i];
                                App.contracts.Item.at(address).then(function (instance) {
                                    instance.name().then(function (name) {
                                        showItem({
                                            name: name,
                                            address: instance.address
                                        });
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

    searchItem: function () {
        $candidatesResults.empty();
        var address = $("#searchItem").val();
        App.contracts.Item.at(address).then(function (instance) {
            instance.name().then(function (i) {
                showItem({
                    id: "Something",
                    name: i,
                    address: address
                });
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
});