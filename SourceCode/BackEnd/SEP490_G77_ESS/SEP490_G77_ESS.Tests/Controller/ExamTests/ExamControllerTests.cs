using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Controllers.ExamManager;
using SEP490_G77_ESS.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using SEP490_G77_ESS.DTO.ExamDTO;

namespace SEP490_G77_ESS.Tests.Controller.ExamTests
{
    [TestFixture]
    public class ExamControllerTests
    {
        private ExamController _controller;
        private EssDbV11Context _context;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_Exam")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _context.Accounts.Add(new Account
            {
                AccId = 15,
                Email = "test@example.com",
                Username = "nguoidungtest",
                Userpass = "matkhau123"
            });

            _context.Exams.AddRange(
                new Exam
                {
                    ExamId = 1,
                    Examname = "Đề thi Toán",
                    Createdate = DateTime.UtcNow,
                    AccId = 15,
                    Examdata = "{}"
                },
                new Exam
                {
                    ExamId = 2,
                    Examname = "Đề thi Vật lý",
                    Createdate = DateTime.UtcNow,
                    AccId = 999,
                    Examdata = "{}"
                }
            );

            _context.SaveChanges();

            _controller = new ExamController(_context);

            // ⚡ Thêm đoạn này để giả HttpContext và User
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                new Claim(ClaimTypes.Email, "test@example.com")  // giả token có email
            }, "TestAuth"))
                }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task LayThongTinBaiThi_ExamIdAm_TraVeNotFound()
        {
            Console.WriteLine("GetExamById failed - exam not found for examId = -1");

            var ketQua = await _controller.GetExamById(-1);

            Assert.That(ketQua, Is.TypeOf<NotFoundObjectResult>());
        }


        [Test]
        public async Task LayThongTinBaiThi_KhongTimThayExam_TraVeNotFound()
        {
            Console.WriteLine("GetExamById failed - exam not found for examId = 9999");

            var ketQua = await _controller.GetExamById(9999);

            Assert.That(ketQua, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task LayThongTinBaiThi_ExamKhongThuocUser_TraVeForbidden()
        {
            Console.WriteLine("GetExamById failed - forbidden access to examId = 2");

            var ketQua = await _controller.GetExamById(2);

            Assert.That(ketQua, Is.TypeOf<ForbidResult>());
        }

        [Test]
        public async Task LayThongTinBaiThi_ExamHopLe_TraVeOk()
        {
            Console.WriteLine("GetExamById success - examId = 1");

            var ketQua = await _controller.GetExamById(1);

            Assert.That(ketQua, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task LayDanhSachBaiThi_KhongCoToken_TraVeUnauthorized()
        {
            Console.WriteLine("GetExamByUser failed - missing authorization token");

            // 👇 Xóa User để mô phỏng không có Token
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var ketQua = await _controller.GetExamByUser();
            Assert.That(ketQua.Result, Is.TypeOf<UnauthorizedObjectResult>());
        }


        [Test]
        public async Task LayDanhSachBaiThi_TokenKhongHopLe_TraVeUnauthorized()
        {
            Console.WriteLine("GetExamByUser failed - invalid token or cannot extract accId");

            // 👇 User có nhưng KHÔNG có Claim Email
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity()) // Không claim email
                }
            };

            var ketQua = await _controller.GetExamByUser();
            Assert.That(ketQua.Result, Is.TypeOf<UnauthorizedObjectResult>());
        }


        [Test]
        public async Task LayDanhSachBaiThi_TokenHopLe_TraVeDanhSachBaiThi()
        {
            Console.WriteLine("GetExamByUser success - returned exam list");

            var ketQua = await _controller.GetExamByUser();

            Assert.That(ketQua.Result, Is.TypeOf<OkObjectResult>());
        }
        // ---------- Test Group 1: GetExamById (4 test) ----------

        [Test]
        public async Task GetExamById_InvalidExamId_ReturnsNotFound()
        {
            Console.WriteLine("GetExamById failed - exam not found for examId = -1");
            var result = await _controller.GetExamById(-1);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetExamById_ExamNotFound_ReturnsNotFound()
        {
            Console.WriteLine("GetExamById failed - exam not found for examId = 9999");
            var result = await _controller.GetExamById(9999);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetExamById_ExamNotOwnedByUser_ReturnsForbidden()
        {
            Console.WriteLine("GetExamById failed - forbidden access to examId = 2");
            var result = await _controller.GetExamById(2);
            Assert.That(result, Is.TypeOf<ForbidResult>());
        }

        [Test]
        public async Task GetExamById_ValidExam_ReturnsOk()
        {
            Console.WriteLine("GetExamById success - examId = 1");
            var result = await _controller.GetExamById(1);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        // ---------- Test Group 2: UpdateExamName (6 test) ----------

        [Test]
        public async Task UpdateExamName_MissingToken_ReturnsUnauthorized()
        {
            Console.WriteLine("UpdateExamName failed - missing authorization token");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.UpdateExamName(1, new ExamName { NewName = "Updated Name" });
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task UpdateExamName_InvalidToken_ReturnsUnauthorized()
        {
            Console.WriteLine("UpdateExamName failed - invalid token or cannot extract accId");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity())
                }
            };

            var result = await _controller.UpdateExamName(1, new ExamName { NewName = "Updated Name" });
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task UpdateExamName_ExamNotFound_ReturnsNotFound()
        {
            Console.WriteLine("UpdateExamName failed - exam not found or not belongs to user");

            var result = await _controller.UpdateExamName(9999, new ExamName { NewName = "Updated Name" });
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }
        [Test]
        public async Task UpdateExamName_EmptyNewName_ReturnsOk()
        {
            Console.WriteLine("UpdateExamName success - even with empty name");

            var newName = new ExamName { NewName = "" }; // Empty
            var result = await _controller.UpdateExamName(1, newName);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateExamName_NewNameTooLong_ReturnsOk()
        {
            Console.WriteLine("UpdateExamName success - even with very long name");

            var newName = new ExamName { NewName = new string('A', 501) }; // >500 characters
            var result = await _controller.UpdateExamName(1, newName);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateExamName_ValidRequest_ReturnsOk()
        {
            Console.WriteLine("UpdateExamName success - examId = 1");

            var result = await _controller.UpdateExamName(1, new ExamName { NewName = "New Exam Name" });
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task DeleteExamById_NoToken_ReturnsUnauthorized()
        {
            Console.WriteLine("DeleteExamById failed - missing authorization token");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.DeleteExamById(1);
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task DeleteExamById_InvalidToken_ReturnsUnauthorized()
        {
            Console.WriteLine("DeleteExamById failed - invalid token or cannot extract accId");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity()) // No email claim
                }
            };

            var result = await _controller.DeleteExamById(1);
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task DeleteExamById_ExamNotFoundOrNotOwned_ReturnsNotFound()
        {
            Console.WriteLine("DeleteExamById failed - exam not found or not owned by user");

            var result = await _controller.DeleteExamById(9999); // Không tồn tại hoặc không thuộc user
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteExamById_ValidDelete_ReturnsOk()
        {
            Console.WriteLine("DeleteExamById success - deleted exam successfully");

            var result = await _controller.DeleteExamById(1);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

    }
}
   