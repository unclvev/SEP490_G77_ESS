using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Controllers.EssayManagement;
using SEP490_G77_ESS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Tests.Controller.EssayExamTests
{
    [TestFixture]
    public class EssayExamControllerTests
    {
        private EssayExamController _controller;
        private EssDbV11Context _context;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_EssayExams")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _context.Exams.Add(new Exam
            {
                ExamId = 2,
                Examname = "Midterm",
                Grade = "12",
                Subject = "Math",
                Classname = "12A1",
                ExamType = "Essay",
                AccId = 2,
                Createdate = DateTime.Now
            });
            _context.Accounts.Add(new Account
            {
                AccId = 2,
                Username = "testuser",
                Userpass = "testpass"
            });

            _context.SaveChanges();

            _controller = new EssayExamController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetExamsByAccount_InvalidAccId_Negative()
        {
            Console.WriteLine("Invalid accountId: must be greater than zero");
            var result = await _controller.GetExamsByAccount(-1, null, null, null);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetExamsByAccount_AccountIdZero()
        {
            Console.WriteLine("Invalid accountId: must be greater than zero");
            var result = await _controller.GetExamsByAccount(0, null, null, null);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetExamsByAccount_AccountIdNotExist()
        {
            Console.WriteLine("Account ID not found in database");
            var result = await _controller.GetExamsByAccount(9999, null, null, null);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetExamsByAccount_ValidAccount_ReturnsExams()
        {
            Console.WriteLine("Get exams by account completed");
            var result = await _controller.GetExamsByAccount(2, null, null, null);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(1));
        }
        [Test]
        public async Task SearchExamsByAccount_InvalidAccId()
        {
            Console.WriteLine("Invalid accountId: must be greater than zero");
            var result = await _controller.SearchExamsByAccount(-1, "Test");
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task SearchExamsByAccount_AccountIdNotExist()
        {
            Console.WriteLine("Account ID not found in database");
            var result = await _controller.SearchExamsByAccount(9999, "Midterm");
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task SearchExamsByAccount_EmptyKeyword()
        {
            Console.WriteLine("Keyword is required for search");
            var result = await _controller.SearchExamsByAccount(2, "");
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task SearchExamsByAccount_ValidInput_ReturnsResults()
        {
            Console.WriteLine("Search exams completed successfully.");
            var result = await _controller.SearchExamsByAccount(2, "Midterm");
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            var list = (ok?.Value as IEnumerable<object>)?.ToList();
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task CreateExam_InvalidAccId_ReturnsBadRequest()
        {
            Console.WriteLine("Invalid accountId: must be greater than 0");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = "12A1" };
            var result = await _controller.CreateExam(-1, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateExam_AccountIdNotExist_ReturnsBadRequest()
        {
            Console.WriteLine("Account not found");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = "12A1" };
            var result = await _controller.CreateExam(9999, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateExam_MissingExamName_ReturnsBadRequest()
        {
            Console.WriteLine("Exam name is required");
            var exam = new Exam { Examname = null, Subject = "Math", Grade = "12", Classname = "12A1" };
            var result = await _controller.CreateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateExam_MissingClassname_ReturnsBadRequest()
        {
            Console.WriteLine("Classname is required");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = null };
            var result = await _controller.CreateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateExam_InvalidClassnameFormat_ReturnsBadRequest()
        {
            Console.WriteLine("Classname must contain both letters and numbers");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = "123" };
            var result = await _controller.CreateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateExam_MissingGrade_ReturnsBadRequest()
        {
            Console.WriteLine("Grade is required");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = null, Classname = "12A1" };
            var result = await _controller.CreateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateExam_ValidInput_ReturnsOk()
        {
            Console.WriteLine("Exam created successfully");
            var exam = new Exam
            {
                Examname = "Midterm",
                Subject = "Math",
                Grade = "12",
                Classname = "12A1"
            };
            var result = await _controller.CreateExam(2, exam);
            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok.Value?.ToString(), Does.Contain("Tạo đề thành công"));
        }
        [Test]
        public async Task UpdateExam_ExamIdNotExist_ReturnsNotFound()
        {
            Console.WriteLine("Exam not found");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = "12A1" };
            var result = await _controller.UpdateExam(9999, exam);
            var notFound = result as NotFoundObjectResult;
            Assert.That(notFound, Is.Not.Null);
            Assert.That(notFound.Value, Is.EqualTo("Exam not found"));
        }

        [Test]
        public async Task UpdateExam_InvalidExamId_ReturnsNotFound()
        {
            Console.WriteLine("Invalid examId: must be greater than 0");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = "12A1" };
            var result = await _controller.UpdateExam(-1, exam);
            var notFound = result as NotFoundObjectResult;
            Assert.That(notFound, Is.Not.Null);
            Assert.That(notFound.Value, Is.EqualTo("Invalid examId: must be greater than 0"));
        }

        [Test]
        public async Task UpdateExam_MissingExamName_ReturnsBadRequest()
        {
            Console.WriteLine("Exam name is required");
            var exam = new Exam { Examname = null, Subject = "Math", Grade = "12", Classname = "12A1" };
            var result = await _controller.UpdateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateExam_MissingClassname_ReturnsBadRequest()
        {
            Console.WriteLine("Classname is required");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = null };
            var result = await _controller.UpdateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateExam_InvalidClassnameFormat_ReturnsBadRequest()
        {
            Console.WriteLine("Classname must contain both letters and numbers");
            var exam = new Exam { Examname = "Midterm", Subject = "Math", Grade = "12", Classname = "123" };
            var result = await _controller.UpdateExam(2, exam);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateExam_ValidInput_ReturnsOk()
        {
            Console.WriteLine("Exam updated successfully");
            var exam = new Exam
            {
                Examname = "Updated Midterm",
                Subject = "Math",
                Grade = "12",
                Classname = "12A1"
            };
            var result = await _controller.UpdateExam(2, exam);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task DeleteExam_InvalidId_ReturnsNotFound()
        {
            Console.WriteLine("Invalid examId: must be greater than 0");
            var result = await _controller.DeleteExam(-1);
            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteExam_ExamNotExist_ReturnsNotFound()
        {
            Console.WriteLine("Exam not found");
            var result = await _controller.DeleteExam(9999);
            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteExam_ValidId_ReturnsOk()
        {
            Console.WriteLine("Exam deleted successfully.");
            var result = await _controller.DeleteExam(2);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
    }
}
