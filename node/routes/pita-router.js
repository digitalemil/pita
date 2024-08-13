let express = require("express");
let router = express.Router();

router.get(['/pitas'], async function (req, res, next) {
  let rows= await getPitas();
  res.send(JSON.stringify(rows));
});

function getUser(req) {
  let user= "local";
  if(process.env.ENV!='local')
    user= req.session.passport.user.email.value;
  return user;

}
router.post(['/createpita'], async function (req, res, next) {
  let id= await createNewPita(getUser(req), req.body.x, req.body.y);
  res.send(id)
});

router.post(['/updatepitatext'], async function (req, res, next) {
  let id= await updatePitaText(req.body.id, req.body.text, getUser(req));
  res.send("");
});

router.post(['/updatepitapos'], async function (req, res, next) {
  let id= await updatePitaPos(req.body.id, req.body.x, req.body.y, getUser(req));
  res.send("");
});

router.post(['/deletepita'], async function (req, res, next) {
  await deletePita(req.body.id, getUser(req));
  let start = new Date();
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

async function getPitas() {
    let values= [tenant, key];
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

async function createNewPita(user, x, y) {
    let values= [user, x, y, tenant, key];
    let result= await executeSQL(sql.create, values);
    return result[0].id;
}

async function deletePita(id, user) {
    let values= [user, id, tenant, key];
    let result= await executeSQL(sql.delete, values);
}

let sql={
"get":"Select convert_from(decrypt(text::bytes, $2::bytes, 'aes'), 'UTF-8') as text, x, y, id from Pita where deleted=false and tenant=$1;",
"updateText":"Update Pita set text=encrypt($1::bytes, $5::bytes, 'aes'), lastupdateby=encrypt($2::bytes, $5::bytes, 'aes'), lastupdateon=current_timestamp() where id= $3 and tenant= $4;",
"updatePos":"Update Pita set x=$1, y=$2, lastupdateby=encrypt($3::bytes, $6::bytes, 'aes'), lastupdateon=current_timestamp() where id= $4 and tenant= $5;",
"create":"Insert into Pita (createdon, createdby, x, y, text, tenant) values (current_timestamp(), encrypt(convert_to($1, 'UTF-8')::bytes, $5, 'aes'), $2, $3, encrypt(convert_to('', 'UTF-8')::bytes, $5, 'aes'), $4) returning id;",
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
