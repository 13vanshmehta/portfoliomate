const { db } = require('../config/firebase');
const Firm = require('../models/Firm');
const { v4: uuidv4 } = require('uuid');

const FIRMS_COLLECTION = 'firms';

const createFirm = async (firmData) => {
  const firmId = uuidv4();
  const firmRef = db().collection(FIRMS_COLLECTION).doc(firmId);
  const firm = new Firm({ firmId, ...firmData });
  await firmRef.set(firm.toJSON());
  return firm;
};

const getFirmById = async (firmId) => {
  const firmDoc = await db().collection(FIRMS_COLLECTION).doc(firmId).get();
  if (!firmDoc.exists) {
    return null;
  }
  return new Firm({ firmId: firmDoc.id, ...firmDoc.data() });
};

const getAllFirms = async (limit = 100) => {
  const snapshot = await db()
    .collection(FIRMS_COLLECTION)
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => new Firm({ firmId: doc.id, ...doc.data() }));
};

const updateFirm = async (firmId, updateData) => {
  const firmRef = db().collection(FIRMS_COLLECTION).doc(firmId);
  updateData.updatedAt = new Date().toISOString();
  await firmRef.update(updateData);
  return await getFirmById(firmId);
};

const deleteFirm = async (firmId) => {
  await db().collection(FIRMS_COLLECTION).doc(firmId).delete();
  return { success: true };
};

const getFirmByEmail = async (firmEmailId) => {
  const snapshot = await db()
    .collection(FIRMS_COLLECTION)
    .where('firmEmailId', '==', firmEmailId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return new Firm({ firmId: doc.id, ...doc.data() });
};

module.exports = {
  createFirm,
  getFirmById,
  getAllFirms,
  updateFirm,
  deleteFirm,
  getFirmByEmail,
};
