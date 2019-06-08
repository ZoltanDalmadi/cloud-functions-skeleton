const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore();
const collectionRef = firestore.collection('quiz');

exports.firestore = (req, res) => {
  collectionRef.listDocuments()
    .then(documentRefs => firestore.getAll(documentRefs))
    .then(documentSnapshots => documentSnapshots.map(sh => sh.data()))
    .then(docs => res.json(docs));
};
