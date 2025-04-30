using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Controllers.QuestionBank;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.BankdDTO;
using Microsoft.AspNetCore.Authorization;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace SEP490_G77_ESS.Tests.Controller.BankTests
{
    [TestFixture]
    public class QuestionControllerTests
    {
        private QuestionController _controller;
        private EssDbV11Context _context;
        private Mock<IAuthorizationService> _mockAuthorizationService;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_Questions")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _mockAuthorizationService = new Mock<IAuthorizationService>();
            _mockAuthorizationService
                .Setup(x => x.AuthorizeAsync(
                    It.IsAny<ClaimsPrincipal>(),
                    It.IsAny<object>(),
                    It.IsAny<IEnumerable<IAuthorizationRequirement>>()))
                .ReturnsAsync(AuthorizationResult.Success());
            _mockAuthorizationService
    .Setup(x => x.AuthorizeAsync(
        It.IsAny<ClaimsPrincipal>(),
        It.IsAny<object>(),
        It.IsAny<string>()))  // mock cho trường hợp policy string
    .ReturnsAsync(AuthorizationResult.Success());


            // 1. Bank
            _context.Banks.Add(new Bank
            {
                BankId = 1,
                Bankname = "Test Bank",
                Accid = 1,
                GradeId = 1,
                SubjectId = 1,
                CurriculumId = 1
            });

            // 2. Section
            _context.Sections.Add(new Section
            {
                Secid = 1,
                Secname = "Test Section",
                BankId = 1
            });

            // 3. Level
            _context.Levels.Add(new Level { LevelId = 1, Levelname = "Easy" });

            // 4. TypeQuestion
            _context.TypeQuestions.AddRange(
                new TypeQuestion { TypeId = 1, TypeName = "MCQ" },
                new TypeQuestion { TypeId = 2, TypeName = "True/False" },
                new TypeQuestion { TypeId = 3, TypeName = "Fill-In" }
            );

            // 5. Question
            _context.Questions.Add(new Question
            {
                Quesid = 1,
                Quescontent = "Sample Question",
                Secid = 1,
                TypeId = 1,
                Modeid = 1,
                AnswerContent = "A,B,C,D",
                Solution = "Simple solution",
                ImageUrl = null
            });

            // 6. CorrectAnswer
            _context.CorrectAnswers.Add(new CorrectAnswer
            {
                Quesid = 1,
                Content = "A"
            });

            // 7. Question cho GetQuestions_ValidSectionId
            _context.Questions.Add(new Question
            {
                Quesid = 101,
                Quescontent = "1 + 1 = ?",
                Secid = 5,
                TypeId = 1,
                Modeid = 1,
                AnswerContent = "1,2,3,4",
                Solution = "Simple math",
                ImageUrl = null
            });

            _context.CorrectAnswers.Add(new CorrectAnswer
            {
                Quesid = 101,
                Content = "2"
            });

            _context.SaveChanges();

            _controller = new QuestionController(_context, _mockAuthorizationService.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                new Claim(ClaimTypes.Name, "testuser@example.com")
            }, "TestAuthentication"))
                }
            };
        }



        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }
        private QuestionDto CreateValidDto()
        {
            return new QuestionDto
            {
                Quescontent = "1 + 1 = ?",
                Secid = 1,
                TypeId = 1,
                Modeid = 1,
                Solution = "Simple addition.",
                Answers = new List<string> { "1", "2", "3", "4" },
                CorrectAnswers = new List<string> { "2" },
                ImageUrl = "https://example.com/image.png"
            };
        }


        // ===== TESTS CHO GETQUESTIONS =====

        [Test]
        public async Task GetQuestions_InvalidSectionId_MinusOne()
        {
            Console.WriteLine(" sectionId = -1 → expect empty list");
            var result = await _controller.GetQuestions(-1);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok.Value, Is.InstanceOf<List<QuestionDto>>());
            Assert.That((ok.Value as List<QuestionDto>)?.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetQuestions_SectionIdZero()
        {
            Console.WriteLine(" sectionId = 0 → expect empty list");
            var result = await _controller.GetQuestions(0);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok.Value, Is.InstanceOf<List<QuestionDto>>());
            Assert.That((ok.Value as List<QuestionDto>)?.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetQuestions_SectionIdNotExist()
        {
            Console.WriteLine("sectionId = 9999 → expect empty list");
            var result = await _controller.GetQuestions(9999);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok.Value, Is.InstanceOf<List<QuestionDto>>());
            Assert.That((ok.Value as List<QuestionDto>)?.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetQuestions_ValidSectionId()
        {
            Console.WriteLine(" sectionId = 5 (valid) → expect 1 question");
            var result = await _controller.GetQuestions(5);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            var questions = ok?.Value as List<QuestionDto>;
            Assert.That(questions, Is.Not.Null);
            Assert.That(questions.Count, Is.EqualTo(1));
            Assert.That(questions[0].Quescontent, Does.Contain("1 + 1"));
        }

        [Test]
        public async Task GetQuestions_SectionIdMissing_DefaultZero()
        {
            Console.WriteLine(" sectionId missing (default = 0) → expect empty list");
            var result = await _controller.GetQuestions(default);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok.Value, Is.InstanceOf<List<QuestionDto>>());
            Assert.That((ok.Value as List<QuestionDto>)?.Count, Is.EqualTo(0));
        }

        // ===== TESTS CHO CREATEQUESTION =====

        [Test]
        public async Task CreateQuestion_EmptyQuesContent_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Question content must not be empty!\"");
            var dto = new QuestionDto { Quescontent = null, Secid = 1, TypeId = 1, Modeid = 1, Answers = new List<string> { "A", "B" }, CorrectAnswers = new List<string> { "A" } };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_InvalidSectionId_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Invalid Section ID!\"");
            var dto = new QuestionDto { Quescontent = "Q?", Secid = 0, TypeId = 1, Modeid = 1, Answers = new List<string> { "A", "B" }, CorrectAnswers = new List<string> { "A" } };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_InvalidTypeId_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Invalid question type!\"");
            var dto = new QuestionDto { Quescontent = "Q?", Secid = 1, TypeId = 0, Modeid = 1, Answers = new List<string> { "A", "B" }, CorrectAnswers = new List<string> { "A" } };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_InvalidModeId_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Invalid difficulty level!\"");
            var dto = new QuestionDto { Quescontent = "Q?", Secid = 1, TypeId = 1, Modeid = 0, Answers = new List<string> { "A", "B" }, CorrectAnswers = new List<string> { "A" } };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_Type1_MissingCorrectAnswer_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Multiple-choice question must have exactly one correct answer!\"");
            var dto = new QuestionDto { Quescontent = "Q?", Secid = 1, TypeId = 1, Modeid = 1, Answers = new List<string> { "A", "B" }, CorrectAnswers = new List<string>() };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_Type2_MissingTrueFalseAnswers_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"True/False question must have exactly 4 answers corresponding to 4 parts!\"");
            var dto = new QuestionDto { Quescontent = "Q?", Secid = 1, TypeId = 2, Modeid = 1, Answers = null, CorrectAnswers = new List<string> { "True", "False", "True" } };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_Type3_InvalidLength_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Fill-in-the-blank question must have exactly 1 correct answer of 4 characters!\"");
            var dto = new QuestionDto { Quescontent = "Q?", Secid = 1, TypeId = 3, Modeid = 1, Answers = null, CorrectAnswers = new List<string> { "12" } };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateQuestion_Valid_ReturnsOk()
        {
            Console.WriteLine("✅ \"Question has been successfully created!\"");
            var dto = new QuestionDto
            {
                Quescontent = "1 + 1 = ?",
                Secid = 1,
                TypeId = 1,
                Modeid = 1,
                Answers = new List<string> { "1", "2", "3", "4" },
                CorrectAnswers = new List<string> { "2" }
            };
            var result = await _controller.CreateQuestion(dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task UpdateQuestion_EmptyQuesContent_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Question content must not be empty!\"");
            var dto = CreateValidDto();
            dto.Quescontent = "";
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_InvalidSectionId_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Invalid Section ID!\"");

            // 👉 Insert thêm một Section dummy có Secid = 0 (hoặc đừng sửa Secid của câu hỏi đang tồn tại)
            var dto = CreateValidDto();
            dto.Secid = 0; // muốn test Secid invalid

            // 👉 Nhưng ID = 0 là không hợp lệ nên UpdateQuestion logic sẽ fail sớm → ta cần đảm bảo _context.Sections không bị null
            var result = await _controller.UpdateQuestion(1, dto);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }


        [Test]
        public async Task UpdateQuestion_InvalidTypeId_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Invalid question type!\"");
            var dto = CreateValidDto();
            dto.TypeId = 0;
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_InvalidModeId_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Invalid difficulty level!\"");
            var dto = CreateValidDto();
            dto.Modeid = 0;
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_Type1_MissingCorrectAnswer_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"MCQ must have exactly one correct answer!\"");
            var dto = CreateValidDto();
            dto.TypeId = 1;
            dto.CorrectAnswers = new List<string>(); // thiếu
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_Type2_NotEnoughTrueFalse_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"True/False must have exactly 4 answers!\"");
            var dto = CreateValidDto();
            dto.TypeId = 2;
            dto.CorrectAnswers = new List<string> { "True", "False", "True" }; // thiếu 1
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_Type3_InvalidLength_ReturnsBadRequest()
        {
            Console.WriteLine("❌ \"Fill-in must have one 4-char answer!\"");
            var dto = CreateValidDto();
            dto.TypeId = 3;
            dto.CorrectAnswers = new List<string> { "123" }; // không đủ 4 ký tự
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_ValidUpdate_ReturnsOk()
        {
            Console.WriteLine("✅ \"The question has been successfully updated!\"");
            var dto = CreateValidDto();
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateQuestion_InvalidImageUrl_StillUpdates()
        {
            Console.WriteLine("⚠️ Invalid image URL → still updates (optional field)");
            var dto = CreateValidDto();
            dto.ImageUrl = "not_a_url.jpg"; // giả định là không bị validate chặt
            var result = await _controller.UpdateQuestion(1, dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task DeleteQuestion_IdNegative_ReturnsNotFound()
        {
            Console.WriteLine("❌ \"INVALID QUESTION ID!\" with id = -1 (but controller returns NotFound)");
            var result = await _controller.DeleteQuestion(-1);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteQuestion_IdZero_ReturnsNotFound()
        {
            Console.WriteLine("❌ \"INVALID QUESTION ID!\" with id = 0 (but controller returns NotFound)");
            var result = await _controller.DeleteQuestion(0);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteQuestion_IdNotExist_ReturnsNotFound()
        {
            Console.WriteLine("❌ \"QUESTION NOT FOUND!\" with id = 9999");
            var result = await _controller.DeleteQuestion(9999);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteQuestion_ValidId_ReturnsOk()
        {
            Console.WriteLine("✅ \"QUESTION, CORRECT ANSWERS, AND IMAGE DELETED SUCCESSFULLY\"");
            // Tạo câu hỏi có ảnh và đáp án đúng
            var question = new Question
            {
                Quesid = 2,
                Quescontent = "Sample question?",
                Secid = 1,
                TypeId = 1,
                Modeid = 1,
                AnswerContent = "A,B,C,D",
                ImageUrl = "/images/test.png"
            };

            _context.Questions.Add(question);
            _context.CorrectAnswers.Add(new CorrectAnswer { Quesid = 2, Content = "A" });

            // Tạo file ảnh giả lập
            var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "test.png");
            Directory.CreateDirectory(Path.GetDirectoryName(imagePath));
            await File.WriteAllTextAsync(imagePath, "fake image");

            await _context.SaveChangesAsync();

            var result = await _controller.DeleteQuestion(2);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            Assert.That(File.Exists(imagePath), Is.False); // Ảnh đã bị xóa
        }


    }
}
