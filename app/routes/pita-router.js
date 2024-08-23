let express = require("express");
let router = express.Router();

router.get(['/pitas'], async function (req, res, next) {
  let start = new Date();
  let rows= await getPitas(global.getUser(req));
  res.send(JSON.stringify(rows));
  global.httpRequestDurationMilliseconds.labels(req.route.path.toString(), res.statusCode.toString(), req.method.toString()).observe(new Date() - start)
  setTimeout(global.sleepRequest, 10);
});

router.post(['/createpita'], async function (req, res, next) {
  let start = new Date();
  let id= await createNewPita(global.getUser(req), req.body.x, req.body.y, req.body.w, req.body.h);
  res.send(id);
  global.httpRequestDurationMilliseconds.labels(req.route.path.toString(), res.statusCode.toString(), req.method.toString()).observe(new Date() - start)
  setTimeout(global.sleepRequest, 10);
});

router.post(['/updatepitatext'], async function (req, res, next) {
  let start = new Date();
  let p= req.route.path.toString();
  let id= await updatePitaText(req.body.id, req.body.text, global.getUser(req));
  res.send("");
  global.httpRequestDurationMilliseconds.labels(req.route.path.toString(), res.statusCode.toString(), req.method.toString()).observe(new Date() - start)
  setTimeout(global.sleepRequest, 10);
});

router.post(['/updatepitapos'], async function (req, res, next) {
  let start = new Date();
  let id= await updatePitaPos(req.body.id, req.body.x, req.body.y, global.getUser(req));
  res.send("");
  global.httpRequestDurationMilliseconds.labels(req.route.path.toString(), res.statusCode.toString(), req.method.toString()).observe(new Date() - start)
  setTimeout(global.sleepRequest, 10);
});

router.post(['/deletepita'], async function (req, res, next) {
  let start = new Date();
  await deletePita(req.body.id, global.getUser(req));
  global.httpRequestDurationMilliseconds.labels(req.route.path.toString(), res.statusCode.toString(), req.method.toString()).observe(new Date() - start)
  setTimeout(global.sleepRequest, 10);
});

let executeSQL= null;
let tenant= undefined;
let key="";

async function initPita(sqlexecfunction, t, k) {
    executeSQL= sqlexecfunction;
    tenant= t;
    key= k;
    await executeSQL(ddl);
}

async function getPitas(user) {
    let values= [tenant, key, user];
    let result= await executeSQL(sql.get, values);
    return result;
}

async function updatePitaText(id, text, user) {
    let values= [text, user, id, tenant, key];
    await executeSQL(sql.updateText, values);
}

async function updatePitaPos(id, x, y, user) {
    let values= [x, y, user, id, tenant, key];
    await executeSQL(sql.updatePos, values);
}

async function createNewPita(user, x, y, w, h) {
    let values= [user, x, y, w, h, tenant, key];
    let result= await executeSQL(sql.create, values);
    return result[0].id;
}

async function deletePita(id, user) {
    let values= [user, id, tenant, key];
    let result= await executeSQL(sql.delete, values);
}

let sql={
"get":"Select convert_from(decrypt(text::bytes, $2::bytes, 'aes'), 'UTF-8') as text, x, y, w, h, color, textcolor, id from Pita where deleted=false and tenant=$1 and convert_from(decrypt(createdby::bytes, $2::bytes, 'aes'), 'UTF-8')=$3;",
"updateText":"Update Pita set text=encrypt($1::bytes, $5::bytes, 'aes'), lastupdateby=encrypt($2::bytes, $5::bytes, 'aes'), lastupdateon=current_timestamp() where id= $3 and tenant= $4;",
"updatePos":"Update Pita set x=$1, y=$2, lastupdateby=encrypt($3::bytes, $6::bytes, 'aes'), lastupdateon=current_timestamp() where id= $4 and tenant= $5;",
"create":"Insert into Pita (createdon, createdby, x, y, w, h, text, tenant) values (current_timestamp(), encrypt(convert_to($1, 'UTF-8')::bytes, $7, 'aes'), $2, $3, $4, $5, encrypt(convert_to('', 'UTF-8')::bytes, $7, 'aes'), $6) returning id;",
"delete": "Update Pita set deleted=true, deletedby=encrypt(convert_to($1, 'UTF-8')::bytes, $4, 'aes'), deletedon=current_timestamp() where id=$2 and tenant=$3;",
};

let ddl=`
Create Table if not exists Pita (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdon TIMESTAMP,
        createdby TEXT,
        lastupdateon TIMESTAMP,
        lastupdateby TEXT,
        text TEXT DEFAULT '',
        lasttext TEXT DEFAULT '',
        textcolor TEXT DEFAULT 'rgba(20, 20, 20, 0.6)',
        color TEXT DEFAULT 'rgba(200, 200, 200, 1.0)',
        x INT DEFAULT 16,
        y INT DEFAULT 16,
        w INT DEFAULT 320,
        h INT DEFAULT 320,
        tenant TEXT NOT NULL,
        deleted boolean DEFAULT false,
        deletedby TEXT,
        deletedon TIMESTAMP,
        CONSTRAINT "pita-primary" PRIMARY KEY (id, tenant)
 	);`

module.exports = router;
router.initPita= initPita;
