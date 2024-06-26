import express, { Express, Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid'
import db from './services/database';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt, verifyToken, getTokenId } from './services/authentication';
import { getUser, UserFields, validateUserCreationRequestBody } from "./components/user";

const app: Express = express();

app.get('/', async (_req: Request, res: Response) => {
  const users = db.collection("users")
  const snapshot = await users.count().get();
  return res.json(
    {
      "label": `There are ${snapshot.data().count} users in HockeyNGo`,
      "num": snapshot.data().count
    }
  )
});

app.post('/login', async (req: Request, res: Response) => {
  if (req.body && req.body.username && req.body.password) {
    const users = db.collection("users");
    const snapshot = await users.where("username", "==", req.body.username).get();
    if (snapshot.empty) {
      return res.status(300).json({ error: "Username not found" });
    }
    var token = null;
    var user = snapshot.docs[0];
    if (decrypt(user.data().password) === req.body.password) {
      token = jwt.sign({ id: encrypt(user.id) }, process.env.SECRET || 'secret', { expiresIn: '1h' });
    }
    if (token != null) {
      return res.status(200).json({ success: true, token: token });
    }
    return res.status(303).json({ error: "Invalid credentials" });
  }
  return res.status(305).json({ error: "Missing credentials" });
});

app.delete('/delete', verifyToken, async (req: Request, res: Response) => {
  const users = db.collection("users");
  var id = await getTokenId(req);
  if (id != "" && (await users.doc(id).get()).exists) {
    users.doc(id).delete();
    return res.status(200).json({ message: "User deleted" });
  }
  return res.status(400).json({ error: "failed to find user " });
});

app.get('/getInfo', verifyToken, async (req: Request, res: Response) => {
  const users = db.collection("users");
  var id = await getTokenId(req);
  if (id != "") {
    var user = (await users.doc(id).get()).data();
    var info: typeof UserFields = getUser(user);
    delete info.password;
    return res.status(200).json(info);
  }
  return res.status(400).json({ error: "failed to find user" });
});

app.post('/create', async (req: Request, res: Response) => {
  const users = db.collection("users");
  if (req.body.organizationId === process.env.ORGANIZATION_ID) {
    if (validateUserCreationRequestBody(req)) {
      var user: typeof UserFields = getUser(req.body);
      if (!(await users.where("username", "==", user.username).get()).empty) {
        return res.status(305).json({ error: "Username already exists" });
      }
      var dbuser = { ...user } as Omit<typeof UserFields, "password"> & { password: any };
      dbuser.password = encrypt(user.password);
      dbuser.friendcode = uuidv4();

      users.add(dbuser)
      return res.status(200).json({ message: "User created" });
    }
    return res.status(303).json({ error: "Invalid body" });
  }
  return res.status(300).json({ error: "Invalid organization" });
});

app.put('/update', verifyToken, async (req: Request, res: Response) => {
  const users = db.collection("users");
  var id = await getTokenId(req);
  if (req.body.password) {
    return res.status(303).json({ error: "Password cannot be changed" });
  }
  if (id != "") {
    users.doc(id).update(req.body);
    return res.status(200).json({ message: "User updated" });
  }
  return res.status(400).json({ error: "failed to find user" });
});

app.put('/changePassword', verifyToken, async (req: Request, res: Response) => {
  const users = db.collection("users");
  if (req.body.organizationId === process.env.ORGANIZATION_ID) {
    if (req.body.password && req.body.newPassword) {
      var id = await getTokenId(req);
      var user = users.doc(id);
      var data = (await user.get()).data();
      if (!data) {
        return res.status(300).json({ error: "User not found" });
      }
      if (decrypt(data.password) === req.body.password) {
        user.update({ password: encrypt(req.body.newPassword) });
      } else {
        return res.status(302).json({ error: "Wrong password" });
      }
      return res.status(200).json({ message: "Password changed" });
    }
    return res.status(303).json({ error: "Invalid body" });
  }
  return res.status(300).json({ error: "Invalid organization" });
});

export default app;
