const express = require(`express`)
const app = express()

app.use(express.json())

const transaksiController = require(`../controllers/transaksi-controller`)
const { authorize } = require(`../controllers/auth-controller`)


app.get(`/transaksi`, transaksiController.getTransaksi)
app.get(`/transaksi/:tgl_transaksi`, transaksiController.getTgl)
app.post(`/transaksi/bulan`,[authorize], transaksiController.getBulan)
app.post(`/transaksi`,[authorize], transaksiController.addTransaksi)
app.put(`/transaksi/:id_transaksi`,[authorize], transaksiController.updateTransaksi)
app.put(`/transaksi/:id_transaksi`,[authorize], transaksiController.updatestatus)
app.delete(`/transaksi/:id_transaksi`,[authorize], transaksiController.deleteTransaksi)

module.exports = app