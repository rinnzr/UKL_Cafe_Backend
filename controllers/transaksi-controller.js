const userModel = require(`../models/index`).user;
const transaksiModel = require(`../models/index`).transaksi;
const detailModel = require(`../models/index`).detail_transaksi;
const menuModel = require(`../models/index`).menu;
const mejaModel = require(`../models/index`).meja;
const { fn, col, literal } = require('sequelize');

//tambah transaksi
exports.addTransaksi = async (request, response) => {
  try {
    let transaksi = {
      tgl_transaksi: request.body.tgl_transaksi,
      id_user: request.body.id_user,
      id_meja: request.body.id_meja,
      nama_pelanggan: request.body.nama_pelanggan,
      status: request.body.status,
    };
    let checkMeja = await mejaModel.findOne({
      where: { id_meja: transaksi.id_meja },
    });
    if (checkMeja.status == "terisi") {
      return response.json({
        status: true,
        message: `Meja Sedang Terisi`,
      });
    } else {
      let insertTransaksi = await transaksiModel.create(transaksi);

      let transaksiID = insertTransaksi.id_transaksi;
      let arrayDetail = request.body.detail_transaksi;
      for (let i = 0; i < arrayDetail.length; i++) {
        arrayDetail[i].id_transaksi = transaksiID;
        let menu = await menuModel.findOne({
          where: { id_menu: arrayDetail[i].id_menu },
        });
        arrayDetail[i].harga = menu?.harga;
      }
      await detailModel.bulkCreate(arrayDetail);

      if (transaksi.status === "belum_bayar") {
        // Ubah status meja menjadi "kosong"
        await mejaModel.update(
          { status: "terisi" },
          { where: { id_meja: transaksi.id_meja } }
        );
      }
      return response.json({
        status: true,
        insertTransaksi,
        message: `Data transaksi berhasil ditambahkan`,
      });
    }
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};
//
// exports.updateTransaksi = async (request, response) => {
//   try {
//     const id_transaksi = request.params.id_transaksi;
//     const newData = {
//       tgl_transaksi: request.body.tgl_transaksi,
//       id_user: request.body.id_user,
//       id_meja: request.body.id_meja,
//       nama_pelanggan: request.body.nama_pelanggan,
//       status: request.body.status,
//     };
//     await transaksiModel.update(newData, {
//       where: { id_transaksi },
//     });
//     const arrayDetail = request.body.detail_transaksi;
//     for (let i = 0; i < arrayDetail.length; i++) {
//       const id_menu = arrayDetail[i].id_menu;
//       const menu = await menuModel.findOne({ where: { id_menu } });
//       arrayDetail[i].id_transaksi = id_transaksi;
//       arrayDetail[i].harga = menu?.harga;
//     }
//     if (request.body.status === 'lunas') {
//       const [updated] = await Promise.all([
//         mejaModel.update({ status: 'kosong' }, { where: { id_meja: request.body.id_meja } }),
//         detailModel.bulkCreate(arrayDetail, { updateOnDuplicate: ['id_detail_transaksi'] }),
//       ]);
//       if (!updated[0]) {
//         throw new Error('Failed to update meja status.');
//       }
//     } else {
//       await detailModel.destroy({ where: { id_transaksi } });
//       await detailModel.bulkCreate(arrayDetail);
//     }
//     return response.json({
//       status: true,
//       message: 'Data transaksi berhasil diubah',
//     });
//   } catch (error) {
//     return response.json({
//       status: false,
//       message: error.message,
//     });
//   }
// };
// update transaksi
exports.updateTransaksi = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;
    const newData = {
      status: request.body.status,
    };
    const transaksi = await transaksiModel.findByPk(id_transaksi);
    if (!transaksi) {
      throw new Error("Transaksi not found.");
    }

    const id_meja = transaksi.id_meja;

    await transaksiModel.update(newData, {
      where: { id_transaksi },
    });

    if (request.body.status === "lunas") {
      const [updated] = await Promise.all([
        mejaModel.update({ status: "kosong" }, { where: { id_meja } }),
        // detailModel.bulkCreate(arrayDetail, { updateOnDuplicate: ['id_detail_transaksi'] }),
      ]);

      if (updated[0] === 0) {
        throw new Error("Failed to update meja status.");
      }
    }

    return response.json({
      status: true,
      message: "Data transaksi berhasil diubah",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

// update status transaksi
exports.updatestatus = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;
    const status = request.body.status;
    const id_meja = request.body.id_meja;

    // Update the status of the transaction
    await transaksiModel.update({ status }, { where: { id_transaksi } });

    if (status === "lunas") {
      // Update the status of the meja to "kosong"
      const [updated] = await mejaModel.update(
        { status: "kosong" },
        { where: { id_meja } }
      );
      if (!updated) {
        throw new Error("Failed to update meja status.");
      }
    }

    return response.json({
      status: true,
      message: "Status transaksi berhasil diperbarui",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

//hapus transaksi
exports.deleteTransaksi = async (request, response) => {
  try {
    let id_transaksi = request.params.id_transaksi;
    let id_transaksis = request.params.id_transaksi;
    let transakasis = await transaksiModel.findOne({
      where: {
        id_transaksi: id_transaksis,
      },
    });
    await detailModel.destroy({ where: { id_transaksi: id_transaksi } });
    await transaksiModel.destroy({ where: { id_transaksi: id_transaksi } });
    await mejaModel.update({
      where: {
        id_meja: transakasis.id_meja,
      },
    });
    return response.json({
      status: true,
      message: `Data transaksi berhasil dihapus`,
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

//get semua data transaksi
exports.getTransaksi = async (request, response) => {
  try {
    let result = await transaksiModel.findAll({
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          include: ["menu"],
        },
      ], order: [
        ["id_transaksi", "DESC"]
      ],
    });
    return response.json({
      status: true,
      data: result,
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

const { Op } = require("sequelize");

// get data transaksi berdasarkan tanggal
exports.getTgl = async (req, res) => {
  const { tgl_transaksi } = req.params;

  try {
    const startDate = new Date(tgl_transaksi);
    startDate.setHours(0, 0, 0, 0); // Set start time to 00:00:00

    const endDate = new Date(tgl_transaksi);
    endDate.setHours(23, 59, 59, 999); // Set end time to 23:59:59.999

    const result = await transaksiModel.findAll({
      where: {
        tgl_transaksi: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          include: ["menu"],
        },
      ],
    });

    if (result.length === 0) {
      res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "Data ditemukan",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// get data transaksi berdasarkan bulan
exports.getBulan = async (req, res) => {
  const { tgl_transaksi } = req.params;

  // Check if tgl_transaksi is a valid date in format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(tgl_transaksi)) {
    return res.status(400).json({
      status: "error",
      message:
        "Invalid date format. Please provide the date in YYYY-MM format.",
    });
  }

  try {
    const startMonth = new Date(tgl_transaksi);
    startMonth.setHours(0, 0, 0, 0); // Set time to 00:00:00

    const endMonth = new Date(tgl_transaksi);
    endMonth.setMonth(endMonth.getMonth() + 1); // Set to the next month
    endMonth.setDate(0); // Set day to 0 to get the last day of the current month
    endMonth.setHours(23, 59, 59, 999); // Set time to 23:59:59.999

    const result = await transaksiModel.findAll({
      where: {
        tgl_transaksi: {
          [Op.between]: [startMonth, endMonth],
        },
      },
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          include: ["menu"],
        },
      ],
    });

    if (result.length === 0) {
      res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "Data ditemukan",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
// get transaksi by id user
exports.getUser = async (req, res) => {
  // endpoint untuk mengambil data transaksi berdasarkan id user
  try {
    const result = await transaksiModel.findAll({
      where: { id_user: req.params.id_user },
      include: ["user", "meja"],
      order: [["id_transaksi", "DESC"]],
    });

    if (result) {
      res.status(200).json({
        status: "success",
        data: result,
      });
    } else {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
// get data transaksi sesuai nama user
exports.getNamaUser = async (req, res) => {
  try {
    const param = { nama_user: req.params.nama_user };
    const userResult = await userModel.findAll({
      where: {
        nama_user: param.nama_user,
      },
    });
    if (userResult.length == null) {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
      return;
    }
    const transaksiResult = await transaksiModel.findAll({
      where: {
        id_user: userResult[0].id_user,
      },
    });
    if (transaksiResult.length === 0) {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      message: "data ditemukan",
      data: transaksiResult,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// get data menu yang paling sedikit
exports.getMenu = async (req, res) => {
  try {
    const result = await detailModel.findAll({
      attributes: [
        'id_menu',
        [fn("SUM", col("detail_transaksi.jumlah")), "jumlah"],
      ],
      include: [
        {
          model: menuModel,
          as: 'menu'
        }
      ],
      group: ["id_menu"],
      order: [[literal("jumlah"), "DESC"]],
    }); // mengambil semua data detail_transaksi
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// mencari total pendapatan berdasarkan tanggal
exports.getPendapatanTgl= async (req, res) => { 
  try{
    const param = { tgl_transaksi: req.params.tgl_transaksi }; 
    const result= await detailModel.findAll({
      attributes: [
        [fn('SUM', col('detail_transaksi.harga')), 'pendapatan']
      ],
      include: [
        {
          model: transaksiModel,
          as: 'transaksi',
          where: {
            tgl_transaksi: {
              [Op.between]: [
                param.tgl_transaksi + " 00:00:00",
                param.tgl_transaksi + " 23:59:59",
              ], 
            }
          },
        }
      ],
      group: ['detail_transaksi.id_transaksi']
    })
      res.status(200).json({ 
        status: "success",
        data: result,
        total_keseluruhan: result.reduce((a, b) => a + parseInt(b.dataValues.pendapatan), 0)
      });
  }catch(error) { 
      res.status(400).json({ 
        status: "error",
        message: error.message,
      });
    };
};
//pendapatan bulan
exports.pendapatanBln = async (req, res) => {
  const param = { tgl_transaksi: req.params.tgl_transaksi };
  try {
    const result = await model.transaksi.findAll({
      attributes: [
        [fn('SUM', col('detail_transaksi.harga')), 'pendapatan']
      ],
      include: [
        {
          model: detail_transaksi,
          as: 'detail_transaksi',
          attributes: [] // Anda bisa menambahkan atribut yang ingin Anda ambil di sini
        }
      ],
      where: literal(`MONTH(tgl_transaksi) = ${param.tgl_transaksi}`),
      group: ['transaksi.id_transaksi']
    });

    if (result.length === 0) {
      res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
      });
    } else {
      const total_keseluruhan = result.reduce((a, b) => a + parseInt(b.dataValues.pendapatan), 0);
      res.status(200).json({
        status: "success",
        data: result,
        total_keseluruhan: total_keseluruhan,
      });
    }
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};



