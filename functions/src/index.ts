import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// import * as csv from 'csv-string';
// const fs = require('fs');


admin.initializeApp(functions.config().firebase);

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs", {structuredData: true});
  response.send("Hello from Firebase34");
});

// export const processCsv = functions.storage.object().onFinalize((event => {
//   functions.logger.info("processCsv", {structuredData: true});
//   const fileBucket = event.bucket;
//   const filePath = event.name as string;
//   const contentType = event.contentType;
//   const bucket = admin.storage().bucket(fileBucket);
//   functions.logger.info("fileBucket = " + fileBucket);
//   functions.logger.info("filePath = " + filePath);
//   functions.logger.info("contentType = " + contentType);
//   functions.logger.info("bucket = " + bucket.name);
//   bucket.file(filePath).download().then(async data => {
//     const arr = csv.parse(data.toString());
//     functions.logger.info("arr.length = " + arr.length);
//     for (let i = 0; i < arr.length; i++) {
//       const proj = arr[i];
//       await admin.firestore().collection('projects').add({
//         todd_no: proj[0],
//         project_no: proj[1],
//         project_name: proj[2],
//         client: proj[3],
//         pic: proj[4],
//         pm: proj[5],
//         pc: proj[6],
//         hvac: proj[7],
//         fire: proj[8],
//         plmb: proj[9],
//         elec: proj[10],
//         revit: proj[11],
//         spec: proj[12],
//         start: proj[13],
//         finish: proj[14],
//         comments: proj[15],
//         status: proj[16],
//       }).then(docRef => {
//         functions.logger.info("Document written with ID: " + docRef.id);
//       }).catch(error => {
//         functions.logger.error("Error adding document: " + error);
//       });
//       // for (let j = 0; j < proj.length; j++) {
//       //   const item = proj[j];
//       //   functions.logger.info("item " + j + " = " + item);
//       // }
//     }
//     return;
//   })
//   .catch(err => {
//     functions.logger.error(err);
//     return;
//   })
// }));
