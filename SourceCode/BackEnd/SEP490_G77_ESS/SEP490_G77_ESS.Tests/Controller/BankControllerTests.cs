using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Controllers;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Tests.Controllers
{
    public class BankControllerTests
    {
        private BankController _controller;
        private EssDbV11Context _context;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;

            _context = new EssDbV11Context(options);

            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            var grade = new Grade { GradeId = 1, GradeLevel = "10" };
            var subject = new Subject { SubjectId = 1, SubjectName = "Math" };
            var curriculum = new Curriculum { CurriculumId = 1, CurriculumName = "CB" };

            _context.Grades.Add(grade);
            _context.Subjects.Add(subject);
            _context.Curricula.Add(curriculum);

            var bank = new Bank
            {
                BankId = 1,
                Bankname = "Test Bank",
                Accid = 123,
                Grade = grade,
                Subject = subject,
                Curriculum = curriculum,
                Sections = new List<Section>()
            };
            _context.Banks.Add(bank);

            var defaultSection = new DefaultSectionHierarchy
            {
                DfSectionId = 100,
                DfSectionName = "Default Section",
                Grade = grade,
                Subject = subject,
                Curriculum = curriculum,
                CurriculumId = curriculum.CurriculumId
            };
            _context.DefaultSectionHierarchies.Add(defaultSection);

            var question = new Question
            {
                Quesid = 1,
                Quescontent = "1 + 1 = ?",
                DfSectionId = 100
            };
            _context.Questions.Add(question);

            _context.SaveChanges();

            _controller = new BankController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetBanksByAccount_ReturnsOk_WithData()
        {
            Console.WriteLine("Test: GetBanksByAccount with valid account ID = 123");
            var result = await _controller.GetBanksByAccount(123);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetDefaultBanks_ReturnsOk_WithFilteredData()
        {
            Console.WriteLine("Test: GetDefaultBanks with Grade='10', Subject='Math', Curriculum='CB'");
            var result = await _controller.GetDefaultBanks("10", "Math", "CB");
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetDefaultBank_ReturnsOk_WithValidId()
        {
            Console.WriteLine("Test: GetDefaultBank with valid default section ID = 100");
            var result = await _controller.GetDefaultBank(100);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetDefaultBank_ReturnsNotFound_WhenIdInvalid()
        {
            Console.WriteLine("Test: GetDefaultBank with invalid ID = 999 (expect NotFound)");
            var result = await _controller.GetDefaultBank(999);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetDefaultSectionsByBankId_ReturnsOk_WithValidId()
        {
            Console.WriteLine("Test: GetDefaultSectionsByBankId with valid Bank ID = 100");
            var result = await _controller.GetDefaultSectionsByBankId(100);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetDefaultSectionsByBankId_ReturnsNotFound_WhenIdInvalid()
        {
            Console.WriteLine("Test: GetDefaultSectionsByBankId with invalid Bank ID = 999 (expect NotFound)");
            var result = await _controller.GetDefaultSectionsByBankId(999);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetQuestionsForSection_ReturnsOk_WithValidSection()
        {
            Console.WriteLine("Test: GetQuestionsForSection with valid section ID = 100");
            var result = await _controller.GetQuestionsForSection(100);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetQuestionsForSection_ReturnsNotFound_WithInvalidSection()
        {
            Console.WriteLine("Test: GetQuestionsForSection with invalid section ID = 999 (expect NotFound)");
            var result = await _controller.GetQuestionsForSection(999);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task SearchBanks_ReturnsOk_WhenQueryValid()
        {
            Console.WriteLine("Test: SearchBanks with query = 'Test' and accId = 123");
            var result = await _controller.SearchBanks("Test", 123);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }
    }
}
