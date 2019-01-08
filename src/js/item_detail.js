$(function () {
    const $itemTimeline = $("#item-timeline");

    function createItemCard(item) {
        var $itemRes = $("#item-res");
        $itemRes.empty();
        const date = moment.unix(parseInt(item.date.toString())).format('YYYY-MM-DD HH:mm:ss');// Date.parse(itemDate).toString('yyyy-MM-dd H:i:s')

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

    function createTimeLine(trace) {
        console.log(trace);
        date = moment.unix(parseInt(trace.date.toString())).format('YYYY-MM-DD HH:mm:ss');
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

    const App = {
        contracts: {},

        init: () => {
            return App.initWeb3();
        },

        initWeb3: () => {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
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

            const searchParams = new URLSearchParams(window.location.search);
            App.contracts.Item.at(searchParams.get("address")).then(function (instance) {

                var namePromise = instance.name();
                var datePromise = namePromise.then(function (name) {
                    return instance.createdDate();
                });
                var manufacturerPromise = instance.manufacturer();
                var ownerShipTracePromise = instance.getOwnershipTrace();
                Promise.all([namePromise, datePromise, manufacturerPromise, ownerShipTracePromise]).then(function ([name, date, manufacturer, ownerShipTrace]) {
                    $("#itemAddress").text(instance.address);
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
                    for (var i = 0; i < count; i++) {
                        createTimeLine({owner: owners[i], date: dates[i], mode: modes[i], comment: comments[i]})
                    }

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
});