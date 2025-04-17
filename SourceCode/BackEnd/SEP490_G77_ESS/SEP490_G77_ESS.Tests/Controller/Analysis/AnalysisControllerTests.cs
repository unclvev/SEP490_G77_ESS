using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using SEP490_G77_ESS.Controllers.ExamManager;
using SEP490_G77_ESS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.DTO.AnalysisDTO;

namespace SEP490_G77_ESS.Tests.Controller.Analysis
{
    [TestFixture]
    public class PhanTichControllerTests
    {
        private EssDbV11Context _duLieu;
        private AnalysisController _boDieuKhien;

        [SetUp]
        public void ThietLap()
        {
            var tuyChon = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "CSDL_PhanTich")
                .Options;

            _duLieu = new EssDbV11Context(tuyChon);
            _duLieu.Database.EnsureDeleted();
            _duLieu.Database.EnsureCreated();

            _boDieuKhien = new AnalysisController(_duLieu);

            _duLieu.Exams.Add(new Exam
            {
                ExamId = 1,
                Examname = "GiuaKy",
                Classname = "12A1",
                Subject = "Toán",
                Createdate = DateTime.Now
            });

            _duLieu.StudentResults.Add(new StudentResult
            {
                StudentResultId = 1,
                ExamId = 1,
                StudentCode = "S001",
                StudentName = "Nguyen Van A",
                Score = 8.5f,
                ExamCode = "E01",
                CreateDate = DateTime.Now
            });

            _duLieu.SaveChanges();
        }

        [TearDown]
        public void HuyBo()
        {
            _duLieu.Dispose();
        }

        [Test]
        public async Task LayKetQuaHocSinh_ExamIdAm_TraVeBadRequest()
        {
            Console.WriteLine("GetStudentResultsByExamId failed - examId is invalid");

            var ketQua = await _boDieuKhien.GetStudentResultsByExamId(-1);

            Assert.That(ketQua.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task LayKetQuaHocSinh_ExamIdBangKhong_TraVeBadRequest()
        {
            Console.WriteLine("GetStudentResultsByExamId failed - examId is invalid");

            var ketQua = await _boDieuKhien.GetStudentResultsByExamId(0);

            Assert.That(ketQua.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task LayKetQuaHocSinh_KhongTimThayExam_TraVeOK_DanhSachRong()
        {
            Console.WriteLine("GetStudentResultsByExamId - no student results found");

            // Arrange
            var ketQua = await _boDieuKhien.GetStudentResultsByExamId(9999); // examId không có trong DB

            // Act & Assert
            Assert.That(ketQua.Result, Is.TypeOf<OkObjectResult>());

            var objectResult = ketQua.Result as OkObjectResult;
            Assert.That(objectResult, Is.Not.Null);

            var danhSach = objectResult.Value as IEnumerable<StudentResultAnalysisDto>;
            Assert.That(danhSach, Is.Not.Null);
            Assert.That(danhSach.Count(), Is.EqualTo(0));
        }


        [Test]
        public async Task LayKetQuaHocSinh_ExamTonTai_KhongCoHocSinh_TraVeDanhSachRong()
        {
            Console.WriteLine("GetStudentResultsByExamId - no student results found");

            _duLieu.Exams.Add(new Exam
            {
                ExamId = 2,
                Examname = "CuoiKy",
                Classname = "12A2",
                Subject = "Ly",
                Createdate = DateTime.Now
            });
            _duLieu.SaveChanges();

            var ketQua = await _boDieuKhien.GetStudentResultsByExamId(2);

            var okResult = ketQua.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var danhSach = okResult.Value as IEnumerable<object>;
            Assert.That(danhSach, Is.Empty);
        }

        [Test]
        public async Task LayKetQuaHocSinh_ExamVaHocSinhTonTai_TraVeDanhSach()
        {
            Console.WriteLine("GetStudentResultsByExamId success - returned 1 result(s)");

            var ketQua = await _boDieuKhien.GetStudentResultsByExamId(1);

            var okResult = ketQua.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var danhSach = okResult.Value as IEnumerable<object>;
            Assert.That(danhSach, Is.Not.Null);
            Assert.That(danhSach.Count(), Is.EqualTo(1));
        }
    }
}
