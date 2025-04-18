using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Controllers.ExamManager;
using SEP490_G77_ESS.Models;
using System;
using System.Threading.Tasks;
using SEP490_G77_ESS.DTO.ExamDTO;

namespace SEP490_G77_ESS.Tests.Controller.ExamTests
{
    [TestFixture]
    public class ExamDataControllerTests
    {
        private ExamDataController _controller;
        private EssDbV11Context _context;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_ExamData")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _context.Exams.Add(new Exam
            {
                ExamId = 1,
                Examname = "Đề thi mẫu",
                Createdate = DateTime.UtcNow,
                AccId = 15,
                Examdata = "{}" // Giả examdata rỗng
            });

            _context.SaveChanges();

            _controller = new ExamDataController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetExamData_ExamIdNegative_ReturnsBadRequest()
        {
            Console.WriteLine("GetExamData failed - invalid examId: -1");

            var result = await _controller.GetExamData(-1);

            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task GetExamData_ExamNotFound_ReturnsNotFound()
        {
            Console.WriteLine("GetExamData failed - exam not found for examId = 9999");

            var result = await _controller.GetExamData(9999);

            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task GetExamData_Valid_ReturnsJsonContent()
        {
            Console.WriteLine("GetExamData success - returned JSON content");

            var result = await _controller.GetExamData(1);

            Assert.That(result, Is.TypeOf<ContentResult>());
            var contentResult = result as ContentResult;
            Assert.That(contentResult?.ContentType, Is.EqualTo("application/json"));
            Assert.That(contentResult?.Content, Is.Not.Null);
        }

        [Test]
        public async Task AddExamDataDemo_ExamNotFound_ReturnsNotFound()
        {
            Console.WriteLine("AddExamDataDemo failed - exam not found for examId = 9999");

            var result = await _controller.AddExamDataDemo(9999);

            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task AddExamDataDemo_ValidExam_ReturnsOk()
        {
            Console.WriteLine("AddExamDataDemo success - demo data added to examId = 1");

            var result = await _controller.AddExamDataDemo(1);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Assert.That(okResult?.Value.ToString(), Does.Contain("Exam data added successfully"));
        }
        [Test]
        public async Task UpdateExamData_ExamNotFound_ReturnsNotFound()
        {
            Console.WriteLine("UpdateExamData failed - exam not found for examId = 9999");

            var fakeUpdate = new ExamUpdateDTO
            {
                Exam = new ExamInfoDTO { ExamName = "Updated Exam Name" },
                Examdata = new ExamDataDetailDTO
                {
                    Questions = new List<QuestionDTO>
            {
                new QuestionDTO
                {
                    QuestionId = 999,
                    Content = "Sample Question",
                    Type = "Multiple Choice",
                    Answers = new List<AnswerDTO>
                    {
                        new AnswerDTO { AnswerId = 1, Content = "Answer A", IsCorrect = true },
                        new AnswerDTO { AnswerId = 2, Content = "Answer B", IsCorrect = false }
                    }
                }
            }
                }
            };

            var result = await _controller.UpdateExamData(9999, fakeUpdate);

            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }


        [Test]
        public async Task UpdateExamData_ValidUpdate_ReturnsOk()
        {
            Console.WriteLine("UpdateExamData success - exam updated for examId = 1");

            var update = new ExamUpdateDTO
            {
                Exam = new ExamInfoDTO { ExamName = "Updated Exam Name" },
                Examdata = new ExamDataDetailDTO
                {
                    Questions = new List<QuestionDTO>
            {
                new QuestionDTO
                {
                    QuestionId = 101,
                    Content = "Updated Question Content",
                    Type = "Multiple Choice",
                    Answers = new List<AnswerDTO>
                    {
                        new AnswerDTO { AnswerId = 1, Content = "Answer A", IsCorrect = true },
                        new AnswerDTO { AnswerId = 2, Content = "Answer B", IsCorrect = false }
                    }
                }
            }
                }
            };

            var result = await _controller.UpdateExamData(1, update);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Assert.That(okResult?.Value.ToString(), Does.Contain("Exam data updated successfully"));
        }

    }
}
