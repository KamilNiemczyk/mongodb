const express = require("express");
const recordRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

recordRoutes.route("/products").get(async function(req, res) {
    try {
        let db_connect = dbo.getDb("magazyn");
        let query = {};
        let sort = {};
        let sortField = req.query.sortField;
        let sortOrder = req.query.sortOrder;
        let filterField = req.query.filterField;
        let filterValue = req.query.filterValue;
        if (sortField && sortOrder) {
            sort[sortField] = parseInt(sortOrder);
        }
        if (filterField && filterValue) {
            query[filterField] = filterValue;
        }
        let result = await db_connect.collection("products").find(query).sort(sort).toArray()
        res.json(result);
    } catch (err) {
        console.error(err);
    }
});
recordRoutes.route("/products/add").post(async function(req, response){
    try {
        let db_connect = dbo.getDb("magazyn");
        let myobj = {
            nazwa: req.body.nazwa,
            cena: req.body.cena,
            opis: req.body.opis,
            ilosc: req.body.ilosc,
            jednostka: req.body.jednostka,
    };
        let result = await db_connect.collection("products").findOne({nazwa: req.body.nazwa}, function(err, result) {
        if (err) throw err;
        if (result) {
            response.json({message: "Product already exists"});
        } else {
            db_connect.collection("products").insertOne(myobj, function(err, res){
                if (err) throw err;
                response.json(res);
            });
        }
    }
    );
    res.json(result);
    } catch (err) {
        console.error(err);
    }
});

recordRoutes.route("/products/:id").put(async function(req, res){
    let product_id = req.params.id;
    let db_connect = dbo.getDb("magazyn");
    let myobj = {
        nazwa: req.body.nazwa,
        cena: req.body.cena,
        opis: req.body.opis,
        ilosc: req.body.ilosc,
        jednostka: req.body.jednostka,
    }
    try{
        const result = await db_connect.collection("products").updateOne({_id: new ObjectId(product_id)}, {$set: myobj});
        if (result.matchedCount === 0) {
            res.json({ error: 'Nie ma produktu o takim ID' });
          } else {
            res.json({ message: 'Zaktualizowany produkt' });
          }
    } catch (err) {
        console.error(err);
    } 
});

recordRoutes.route("/products/:id").delete(async function (req, res) {
    const productId = req.params.id;
    let db_connect = dbo.getDb("magazyn");
    try {
      const result = await db_connect.collection("products").deleteOne({ _id: new ObjectId(productId) });
      if (result.deletedCount === 0) {
        res.json({ error: 'Nie znaleziono produktu' });
      } else {
        res.json({ message: 'Usunieto ten produkt' });
      }
    } catch (err) {
      console.error(err);
    }
});

recordRoutes.route("/products/report").get(async function(req, res) {
    let db_connect = dbo.getDb("magazyn");
    try{
        const totalProducts = await db_connect.collection("products").countDocuments();
        const report = await db_connect.collection("products").aggregate([
            {
                $group: {
                    _id: null,
                    SUMA : {$sum: { $multiply: ['$cena', '$ilosc']}},
                    ILOSCPRODUKTÓW: {$first : totalProducts}
                }
            },
            {
                $project: {
                    _id: 0,
                    SUMA: {$round: ['$SUMA', 2]},
                    ILOSCPRODUKTÓW: 1
                }
            }
        ]).toArray();
        res.json(report);
    }catch (err) {
        console.error(err);
    }
});

module.exports = recordRoutes;
