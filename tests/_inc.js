// Paths must be relative to the Makefile dir (Leaflet.Storage root).
require('./tests/casperserver/casperserver.js').create(casper, {
    port: 8007,
    responsesDir: './tests/responses/'
});

casper.server.watchPath('^(/src/|/reqs/|/contrib/)', {
    filePath: function (request) {
        return '.' + request.url;
    },
    permanent: true
});

casper.on("page.error", function(msg, trace) {
    this.echo("Error: " + msg, "ERROR");
    require('utils').dump(trace);
});

DEFAULT_DATALAYER = {
    "icon_class": "Default",
    "name": "Elephants",
    "display_on_load": true,
    "pk": 62,
    "pictogram_url": null,
    "options": {
        "opacity": null,
        "weight": null,
        "fillColor": "",
        "color": "",
        "stroke": true,
        "smoothFactor": null,
        "dashArray": "",
        "fillOpacity": null,
        "fill": true
    }
};

casper.toggleEditButton = function () {
    this.click('a.leaflet-control-edit-toggle');
};

casper.getUploadDataForm = function () {
    var path = '/map/42/import/data/';
    this.toggleEditButton();
    this.server.watchPath(path, {filePath: 'map_upload_data_GET'});
    this.then(function () {
        this.test.assertVisible('a.upload-data', 'UploadData button is visible');
        this.click('a.upload-data');
    });
};

casper.fillAndSubmitUploadDataForm = function (vals) {
    this.test.assertExists('form#upload_data');
    this.server.watchPath(path, {content: JSON.stringify({datalayer: DEFAULT_DATALAYER, info: 'ok'})});
    this.fill('form#upload_data', vals);
    this.click('form#upload_data input[type="submit"]');
};


casper.getDataLayerEditForm = function (id) {
    this.mouseEvent('mouseover', 'div.leaflet-control-browse');
    // this.test.assertVisible('.storage-browse-actions', 'Datalayer actions are visibile on mouseover');
    this.test.assertExists('span#edit_datalayer_' + id, 'Edit datalayer button exists when edit enabled');
    // this.test.assertVisible('span#edit_datalayer_' + id, 'Edit datalayer button is visibile when edit enabled');
    this.click('span#edit_datalayer_' + id);
};

casper.datalayerResponsePOST = function (settings) {
    var response = {
        "datalayer": DEFAULT_DATALAYER
    };
    for (var key in settings) {
        if (typeof response[key] !== "undefined") {
            response.datalayer[key] = settings[key];
        }
        else {
            response.datalayer.options[key] = settings[key];
        }
    }
    return {content: JSON.stringify(response)};
};

casper.editDataLayer = function (id, vals) {
    var path = '/map/42/datalayer/edit/' + id +'/';
    this.server.watchPath(path, {filePath: 'map_datalayer_update_GET'});
    this.getDataLayerEditForm(id);
    this.then(function () {
        this.server.watchPath(path, this.datalayerResponsePOST(vals));
        this.fill('form#datalayer_edit', vals);
        this.click('form#datalayer_edit input[type="submit"]');
    });
};

casper.polygonResponsePOST = function (settings) {
    var response = {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[2.7685546875, 55.696163893908825], [1.483154296875, 55.19768334019969], [3.251953125, 53.85252660044951], [7.3388671875, 54.91451400766527], [5.262451171875, 55.59076338488528], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825]]]
        },
        "type": "Feature",
        "id": 76,
        "properties": {
            "datalayer_id": 62,
            "name": "test poly simple",
            "options": {
                "opacity": null,
                "weight": null,
                "color": null,
                "stroke": true,
                "smoothFactor": null,
                "dashArray": null,
                "fillColor": null,
                "fill": null,
                "fillOpacity": null
            },
            "icon": {}
        }
    };
    for (var key in settings) {
        if (typeof response.properties[key] !== "undefined") {
            response.properties[key] = settings[key];
        }
        else {
            response.properties.options[key] = settings[key];
        }
    }
    return {content: JSON.stringify(response)};
};

casper.editPolygon = function (id, selector, vals) {
    var path = '/map/42/polygon/edit/' + id +'/';
    this.server.watchPath(path, {filePath: 'map_polygon_update_GET'});
    this.then(function () {
        this.mouseEvent('dblclick', selector);
    });
    this.then(function () {
        this.server.watchPath(path, this.polygonResponsePOST(vals));
        this.fill('form#feature_form', vals);
        this.click('form#feature_form input[type="submit"]');
    });
};

casper.test.assertElementsCount = function (selector, expected, message) {
    var actual = this.casper.evaluate(function(selector) {
        return __utils__.findAll(selector).length;
    }, selector);
    return this.assert(this.testEquals(actual, expected), message, {
        type: 'assertElementsCount',
        standard: f('"%s" elements found with selector "%s"', expected, selector),
        values: {
            selector: selector,
            actual: actual,
            expected: expected
         }
    });
};

casper.test.assertAttributes = function (selector, expected, message) {
    var actual,
        getAttr = function (selector, name) {
            return __utils__.findOne(selector).getAttribute(name);
        };
    for (var name in expected) {
        actual = this.casper.evaluate(getAttr, {selector: selector, name: name});
        this.assert(actual == expected[name], message, {
            type: 'assertAttributes',
            standard: f('"%s" has attribute "%s" with value "%s"', selector, name, expected[name]),
            values: {
                selector: selector,
                name: name,
                value: expected[name]
             }
        });
    }
};
