var geodist = require('geodist');
var fs = require('fs');
var parse = require('csv-parse');
const AWS = require('aws-sdk');
const BUCKET_NAME = 'skycatch-devops-challenge-prateek';

var inputFileImages = 'images.csv';
var inputFileSites = 'sites.csv';
var arrayOfSites = [];

readingSites(readingimages);

function readingSites(callback) {
    console.log('Reading sites.csv');
    var parser2 = parse({ delimiter: ',' }, function (err, data) {
        data.forEach(function (line) {
            // create imagesRow object out of parsed fields
            var sitesRow = {
                "ID": line[0],
                "Name": line[1],
                "Latitude": line[2],
                "Longitude": line[3],
                "Date": line[4]
            };
            var selectedSite = sitesRow.Name;
            selectedSite = selectedSite.replace(/\s+/g, '_');
            var fileName = selectedSite + "_challenge.csv";
            fs.exists(fileName, function (exists) {
                if (exists) {
                    fs.unlink(fileName);
                }
            });

            arrayOfSites.push(JSON.stringify(sitesRow));

        });
        callback(uploadFiles);
    });
    // read the inputFile, feed the contents to the parser2
    fs.createReadStream(inputFileSites).pipe(parser2);
};

function readingimages(callback2) {
    console.log('Reading images.csv');
    var parser = parse({ delimiter: ',' }, function (err, data) {
        data.forEach(function (line) {
            // create imagesRow object out of parsed fields
            var imagesRow = {
                "ID": line[0],
                "Image": line[1],
                "Latitude": line[2],
                "Longitude": line[3],
                "Date": line[4]
            };
            var distanceBet = 0;
            var flag = true;
            var selectedSite = null;
            var dateOfImage = JSON.parse(JSON.stringify(imagesRow)).Date;
            var latImage = JSON.parse(JSON.stringify(imagesRow)).Latitude;
            var logImage = JSON.parse(JSON.stringify(imagesRow)).Longitude;
            var nameOfImage = JSON.parse(JSON.stringify(imagesRow)).Image;
            var IdOfImage = JSON.parse(JSON.stringify(imagesRow)).ID;
            for (var i = 0; i < arrayOfSites.length; i++) {

                var dateOfSite = JSON.parse(arrayOfSites[i]).Date;

                var latSite = JSON.parse(arrayOfSites[i]).Latitude;
                var logSite = JSON.parse(arrayOfSites[i]).Longitude;
                
                if (dateOfImage == dateOfSite) {
                    if (flag == true) {
                        flag = false;
                        distanceBet = geodist({ lat: latImage, lon: logImage }, { lat: latSite, lon: logSite });
                        selectedSite = JSON.parse(arrayOfSites[i]).Name;

                        //console.log("in true");
                    } else {
                        if (geodist({ lat: latImage, lon: logImage }, { lat: latSite, lon: logSite }) < distanceBet) {
                            selectedSite = JSON.parse(arrayOfSites[i]).Name;
                        }

                        //console.log("in false");
                    }
                }
            }
            var str = "" + selectedSite;
            str = str.replace(/\s+/g, '_');
            fs.appendFileSync(str + "_challenge.csv", IdOfImage + ',' + nameOfImage + '\n');

        });
        callback2();
    });

    // read the inputFile, feed the contents to the parser
    fs.createReadStream(inputFileImages).pipe(parser);
};

function uploadFiles() {
    console.log('Uploading files to S3...');
    AWS.config.loadFromPath('./config.json');


    var selectedSite;
    var fileName;

    for (var i = 0; i < arrayOfSites.length; i++) {

        selectedSite = JSON.parse(arrayOfSites[i]).Name;
        selectedSite = selectedSite.replace(/\s+/g, '_');
        fileName = selectedSite + "_challenge.csv";
        uploadToS3(fileName);

    };

}

function uploadToS3(fileName) {
    // Create S3 service object
    var s3 = new AWS.S3();
    console.log('Uploading : ' + fileName);
    fs.exists(fileName, function (exists) {
        if (exists) {
            var fileStream = fs.createReadStream(fileName);
            var uploadParams = { Bucket: BUCKET_NAME, Key: fileName, Body: fileStream };

            s3.upload(uploadParams, function (err, data) {
                if (err) {
                    console.log('Error uploading to S3 : ' + fileName)
                } if (data) {
                    console.log('File uploaded to S3 : ' + fileName);
                }
            });
        }
    });
}