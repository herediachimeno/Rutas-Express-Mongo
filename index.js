const express = require("express");
const app = express();
const mongodb = require("mongodb");
let MongoClient = mongodb.MongoClient;

const ObjectID = mongodb.ObjectID;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let db;

MongoClient.connect("mongodb://localhost:27017", function (err, client) {
  if (err !== null) {
    console.log(err);
  } else {
    db = client.db("hotel");
    console.log("MongoDB se ha conectado correctamente");
  }
});

app.post("/registro", function (req, res) {
  const usuario = req.body;

  db.collection("clientes").insertOne(usuario, function (err, datos) {
    if (err !== null) {
      res.send(err);
    } else {
      res.send(datos);
    }
  });
});

app.put("/editarcliente", function (req, res) {
  const dni = req.body.dni;

  const cliente = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
  };

  db.collection("clientes").updateOne(
    { dni: dni },
    { $set: cliente },
    function (err, datos) {
      if (err !== null) {
        res.send(err);
      } else {
        res.send(datos);
      }
    }
  );
});

app.post("/checkin", function (req, res) {
  const checkin = req.body;

  db.collection("clientes")
    .find({ dni: checkin.dni })
    .toArray(function (err, cliente) {
      if (err !== null) {
        res.send(err);
      } else {
        if (cliente.length === 0) {
          res.send({ mensaje: "El cliente no está registrado" });
        } else {
          db.collection("habitaciones")
            .find({ numero: checkin.numero })
            .toArray(function (err, habitacion) {
              if (err !== null) {
                res.send(err);
              } else {
                if (habitacion[0].estado === "ocupada") {
                  res.send({
                    mensaje: "La habitación seleccionada no está disponible",
                  });
                } else {
                  db.collection("reservas").insertOne(
                    {
                      numero: checkin.numero,
                      dni: checkin.dni,
                      fechaCheckIn: checkin.checkin,
                    },
                    function (err, datos) {
                      if (err !== null) {
                        res.send(err);
                      } else {
                        db.collection("habitaciones").updateOne(
                          { numero: checkin.numero },
                          { $set: { estado: "ocupada" } },
                          function (err, data) {
                            if (err !== null) {
                              res.send(err);
                            } else {
                              res.send({ mensaje: "Reserva realizada" });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            });
        }
      }
    });
});

app.put("/checkout", function (req, res) {
  const dni = req.body.dni;
  const fechaFin = req.body.checkout;

  db.collection("reservas")
    .find({ dni: dni })
    .toArray(function (err, reserva) {
      if (err !== null) {
        res.send(err);
      } else {
        if (reserva.length === 0) {
          res.send({ mensaje: "No tienes una reserva hecha" });
        } else {
          db.collection("reservas").updateOne(
            { dni: dni },
            { $set: { fechaChecOut: fechaFin } },
            function (err, datos) {
              if (err !== null) {
                res.send(err);
              } else {
                db.collection("habitaciones").updateOne(
                  { numero: reserva[0].numero },
                  { $set: { estado: "libre" } },
                  function (err, data) {
                    if (err !== null) {
                      res.send(err);
                    } else {
                      res.send({ mensaje: "Gracias por su estancia" });
                    }
                  }
                );
              }
            }
          );
        }
      }
    });
});

app.listen(3005);
