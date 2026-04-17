const { db } = require('../config/firebase');
const User = require('../models/User');

const USERS_COLLECTION = 'users';

const createUser = async (userData) => {
  const userRef = db().collection(USERS_COLLECTION).doc(userData.userId);
  const user = new User(userData);
  await userRef.set(user.toJSON());
  return user;
};

const getUserById = async (userId) => {
  const userDoc = await db().collection(USERS_COLLECTION).doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  return new User({ userId: userDoc.id, ...userDoc.data() });
};

const getUserByEmail = async (email) => {
  const snapshot = await db()
    .collection(USERS_COLLECTION)
    .where('emailId', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return new User({ userId: doc.id, ...doc.data() });
};

const updateUser = async (userId, updateData) => {
  const userRef = db().collection(USERS_COLLECTION).doc(userId);
  updateData.updatedAt = new Date().toISOString();
  await userRef.update(updateData);
  return await getUserById(userId);
};

const deleteUser = async (userId) => {
  await db().collection(USERS_COLLECTION).doc(userId).delete();
  return { success: true };
};

const getUsersByFirm = async (firmId, limit = 50) => {
  const snapshot = await db()
    .collection(USERS_COLLECTION)
    .where('firmId', '==', firmId)
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => new User({ userId: doc.id, ...doc.data() }));
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getUsersByFirm,
};
