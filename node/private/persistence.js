const { forEach } = require("async");
const pg = require("pg");
const prom_client = require("prom-client");

const connectionString = process.env.DATABASE_CONNECTIONSTRING;
const cp = new pg.Pool({
    connectionString,
    max: 8
})

async function executeSQLinTxWithRetry(sql, values) {
    return await executeTxWithRetry(async function() { return await executeSQLinTx(sql, values) });
}

async function executeSQLinTx(sql, values) {
    global.logger.log("info", "execute SQL in Transaction.");
    let con = null;
    let start = Date.now();
    let ret = {};
    try {
        con = await cp.connect();
        global.sqlTransactions.inc();

        global.logger.log("info", "Beginning Transaction at: " + start + "/" + new Date());
        await executeQuery(con, "BEGIN TRANSACTION;");
        ret= await executeQuery(con, sql, values);
    }
    catch (err) {
        global.logger.log("error", err);

        if (undefined != con && con != null) {
            try {
                global.logger.log("error", "Rolling back transaction.");
                executeQuery(con, "ROLLBACK;");
                con.release();
                global.sqlRollbacks.inc();

                if (err.code !== '40001') {
                    throw err;
                }
                // err.code === '40001'
                // let's retry
                return err.code;
            }
            catch (ex2) {
                global.logger.log("error", ex2);
            }
        }
        throw err;
    }
    if (undefined != con && con != null) {
        await executeQuery(con, "COMMIT;");
        con.release();
        global.sqlCommits.inc();

        global.logger.log("info", "SQL executed. ret= '" + JSON.stringify(ret) + "'. Transaction commited. Duration: " + (Date.now() - start) + " ms.");
    }
    else {
        global.logger.error("error", "No database connection!");
    }
    return ret;
}

async function executeTxWithRetry(tx, ...args) {
    const maxRetries = 5;
    const backOff = 100;
    let tries = 0;
    let result = null;

    while (tries < maxRetries) {
        try {
            result = await tx(...args);
            if ('40001' === result) {
                global.sqlRetries.inc();
                await new Promise((r) => setTimeout(r, tries * backOff));
                global.logger.log("info", "Retrying Transaction at: " + start + "/" + new Date() + " attempt: " + (tries + 1));
            }
            else {
                global.sqlIsUp.set(1);
                return result;
            }
        }
        catch (err) {
            global.logger.log("exeTx: error", err.toString());
            global.sqlIsUp.set(0);
            return result;
        }
        tries++;
        if (tries == maxRetries) {
            global.logger.log("error", "Max retries reached. Giving up");
        }
    }
    return result;
}

async function executeQuery(con, query, values) {
    let start = Date.now();

    let lq = query.toLowerCase().trim();
    let promlabel = lq;
    if (promlabel.includes("where")) {
        promlabel = query.substring(0, promlabel.indexOf("where"));
    }
    if (promlabel.includes("values")) {
        promlabel = query.substring(0, promlabel.indexOf("values"));
    }
    if (lq.startsWith("insert"))
        global.sqlInserts.labels(promlabel).inc();
    if (lq.startsWith("delete"))
        global.sqlDeletes.labels(promlabel).inc();
    if (lq.startsWith("upsert"))
        global.sqlUpserts.labels(promlabel).inc();
    if (lq.startsWith("update"))
        global.sqlUpdates.labels(promlabel).inc();
    if (lq.startsWith("select"))
        global.sqlSelects.labels(promlabel).inc();
    global.sqlQueries.labels(promlabel).inc();

    global.logger.log("info", "SQL: " + query.substring(0, Math.min(256, query.length)));
    if (query.length > 256) {
        global.logger.log("info", "\tQuery Truncated. Total length: " + query.length);
    }
    let res;
    try {
        res = await con.query(query, values);
    }
    catch (err) {
        global.logger.log("error", "Can't execute query: " + query.substring(0, Math.max(128, query.length)));
        global.logger.log("error", err.toString());
        global.sqlErrors.inc();
        global.sqlIsUp.set(0);
        global.logger.log("info", "Duration: " + (Date.now() - start) + "ms.");
        return null;
    }
    global.sqlIsUp.set(1);
    global.logger.log("info", "Duration: " + (Date.now() - start) + "ms. Rows: " + res.rows.length);
    if (res.rows.length == 1) {
        let r = JSON.stringify(res.rows[0]);
        global.logger.log("info", "Row 0: " + JSON.stringify(res.rows[0]).substring(0, Math.max(256, r.length)));
    }
    global.sqlQueryDurationMilliseconds
        .labels(promlabel)
        .observe(new Date() - start);

    return res.rows;
}

exports.executeSQL = executeSQLinTxWithRetry;