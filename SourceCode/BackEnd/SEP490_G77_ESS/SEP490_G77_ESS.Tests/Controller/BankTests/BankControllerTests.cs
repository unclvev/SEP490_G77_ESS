using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Controllers;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Tests.Controller.BankTests
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
        [Test]
        public async Task GenerateQuestionBank_InvalidCurriculumMinusTwo_ReturnsBadRequest()
        {
            Console.WriteLine(" CurriculumId = -2 → expect BadRequest");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = -2 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_InvalidCurriculumMinusOne_ReturnsBadRequest()
        {
            Console.WriteLine("CurriculumId = -1 → expect BadRequest");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = -1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_CurriculumIdZero_ReturnsBadRequest()
        {
            Console.WriteLine(" CurriculumId = 0 → expect BadRequest");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = 0 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_ValidCurriculum_ReturnsOk()
        {
            Console.WriteLine(": CurriculumId = 1 (valid) → expect Ok");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_InvalidSubjectZero_ReturnsBadRequest()
        {
            Console.WriteLine(" SubjectId = 0 (invalid) → expect BadRequest");
            var bank = new Bank { GradeId = 1, SubjectId = 0, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_InvalidSubjectMinusTwo_ReturnsBadRequest()
        {
            Console.WriteLine(" SubjectId = -2 (invalid) → expect BadRequest");
            var bank = new Bank { GradeId = 1, SubjectId = -2, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_ValidSubjectId2_ReturnsOk()
        {
            Console.WriteLine("SubjectId = 1 (valid) → expect Ok");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_InvalidGradeIdZero_ReturnsBadRequest()
        {
            Console.WriteLine(" GradeId = 0 (invalid) → expect BadRequest");
            var bank = new Bank { GradeId = 0, SubjectId = 1, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_ValidGradeId_ReturnsOk()
        {
            Console.WriteLine("GradeId = 1 (valid) → expect Ok");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GenerateQuestionBank_ValidFullCombination_ReturnsOk()
        {
            Console.WriteLine(" CurriculumId = 1, SubjectId = 1, GradeId = 1 → expect Ok");
            var bank = new Bank { GradeId = 1, SubjectId = 1, CurriculumId = 1 };
            var result = await _controller.GenerateQuestionBank(123, bank);

            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok.Value.ToString(), Does.Contain("BankId"));
        }

        [Test]
        public async Task GetSectionsByBankId_BankIdNegative_ReturnsNotFound()
        {
            Console.WriteLine(" BankId = -1 → expect NotFound");
            var result = await _controller.GetSectionsByBankId(-1);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetSectionsByBankId_BankIdZero_ReturnsNotFound()
        {
            Console.WriteLine(" BankId = 0 → expect NotFound");
            var result = await _controller.GetSectionsByBankId(0);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetSectionsByBankId_BankIdNotExist_ReturnsNotFound()
        {
            Console.WriteLine(" BankId = 12345 (not exist) → expect NotFound");
            var result = await _controller.GetSectionsByBankId(12345);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetSectionsByBankId_BankIdValid_ReturnsOk()
        {
            Console.WriteLine("UCTC004: BankId = 1 (exist) → expect Ok");

            // Ensure at least one section and section hierarchy exist
            var section = new Section
            {
                Secid = 3,
                Secname = "Section A",
                BankId = 1
            };
            _context.Sections.Add(section);
            _context.SectionHierarchies.Add(new SectionHierarchy
            {
                AncestorId = 3,
                DescendantId = 3,
                Depth = 0
            });
            await _context.SaveChangesAsync();

            var result = await _controller.GetSectionsByBankId(1);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            Assert.That(ok?.Value, Is.Not.Null);
        }
        [Test]
        public async Task AddSection_BankIdNegative_ReturnsNotFound()
        {
            Console.WriteLine(" BankId = -1 → expect NotFound");
            var section = new Section { Secname = "Test Section" };
            var result = await _controller.AddSection(-1, section);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task AddSection_BankIdZero_ReturnsNotFound()
        {
            Console.WriteLine(" BankId = 0 → expect NotFound");
            var section = new Section { Secname = "Test Section" };
            var result = await _controller.AddSection(0, section);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task AddSection_BankIdNotExist_ReturnsNotFound()
        {
            Console.WriteLine(" BankId = 999999 → expect NotFound");
            var section = new Section { Secname = "Test Section" };
            var result = await _controller.AddSection(999999, section);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task AddSection_SectionNameNull_ReturnsBadRequest()
        {
            Console.WriteLine(" secname = null → expect BadRequest");
            var section = new Section { Secname = null };
            var result = await _controller.AddSection(1, section);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task AddSection_SectionNameEmpty_ReturnsBadRequest()
        {
            Console.WriteLine(" secname = \"\" → expect BadRequest");
            var section = new Section { Secname = "" };
            var result = await _controller.AddSection(1, section);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task AddSection_ValidBankAndSectionName_ReturnsOk()
        {
            Console.WriteLine(" BankId = 1, secname = 'Math' → expect Ok");
            var section = new Section { Secname = "Math" };
            var result = await _controller.AddSection(1, section);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task AddSection_AnotherValidBank_ReturnsOk()
        {
            Console.WriteLine(" BankId = 2, secname = 'English' → expect Ok");

            // BankId = 2 must exist
            _context.Banks.Add(new Bank
            {
                BankId = 2,
                Bankname = "Extra Bank",
                GradeId = 1,
                SubjectId = 1,
                CurriculumId = 1,
                Accid = 123
            });
            await _context.SaveChangesAsync();

            var section = new Section { Secname = "English" };
            var result = await _controller.AddSection(2, section);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task AddSubSection_InvalidParentId_Negative_ReturnsNotFound()
        {
            Console.WriteLine(" parentId = -1 → expect NotFound");
            var section = new Section { Secname = "A" };
            var result = await _controller.AddSubSection(-1, section);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task AddSubSection_InvalidParentId_Zero_ReturnsNotFound()
        {
            Console.WriteLine(" parentId = 0 → expect NotFound");
            var section = new Section { Secname = "A" };
            var result = await _controller.AddSubSection(0, section);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task AddSubSection_ParentIdNotExist_ReturnsNotFound()
        {
            Console.WriteLine(" parentId = 999999 → expect NotFound");
            var section = new Section { Secname = "A" };
            var result = await _controller.AddSubSection(999999, section);
            Assert.That(result.Result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task AddSubSection_ParentIdExists_SectionNameNull_ReturnsBadRequest()
        {
            Console.WriteLine(" parentId = 5, secname = null → expect BadRequest");

            _context.Sections.Add(new Section { Secid = 5, Secname = "Parent", BankId = 1 });
            await _context.SaveChangesAsync();

            var section = new Section { Secname = null };
            var result = await _controller.AddSubSection(5, section);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task AddSubSection_ParentIdExists_SectionNameEmpty_ReturnsBadRequest()
        {
            Console.WriteLine(" parentId = 5, secname = \"\" → expect BadRequest");

            _context.Sections.Add(new Section { Secid = 5, Secname = "Parent", BankId = 1 });
            await _context.SaveChangesAsync();

            var section = new Section { Secname = "" };
            var result = await _controller.AddSubSection(5, section);
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task AddSubSection_ValidParentIdAndSectionName_ReturnsOk()
        {
            Console.WriteLine("parentId = 5, secname = \"Math\" → expect Ok");

            _context.Sections.Add(new Section { Secid = 5, Secname = "Parent", BankId = 1 });
            await _context.SaveChangesAsync();

            var section = new Section { Secname = "Math" };
            var result = await _controller.AddSubSection(5, section);
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task UpdateSection_InvalidSectionId_Negative_ReturnsNotFound()
        {
            Console.WriteLine(" SectionId = -1 → expect NotFound");
            var updated = new Section { Secname = "New Name" };
            var result = await _controller.UpdateSection(-1, updated);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateSection_InvalidSectionId_Zero_ReturnsNotFound()
        {
            Console.WriteLine(" SectionId = 0 → expect NotFound");
            var updated = new Section { Secname = "New Name" };
            var result = await _controller.UpdateSection(0, updated);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateSection_SectionIdNotExist_ReturnsNotFound()
        {
            Console.WriteLine(" SectionId = 99999 → expect NotFound");
            var updated = new Section { Secname = "New Name" };
            var result = await _controller.UpdateSection(99999, updated);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateSection_SectionIdValid_SecnameNull_ReturnsOk()
        {
            Console.WriteLine(" SectionId = 5, Secname = null → expect OK");

            _context.Sections.Add(new Section { Secid = 5, Secname = "Original", BankId = 1 });
            await _context.SaveChangesAsync();

            var updated = new Section { Secname = null };
            var result = await _controller.UpdateSection(5, updated);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateSection_SectionIdValid_SecnameEmpty_ReturnsOk()
        {
            Console.WriteLine(" SectionId = 5, Secname = \"\" → expect OK");

            _context.Sections.Add(new Section { Secid = 5, Secname = "Original", BankId = 1 });
            await _context.SaveChangesAsync();

            var updated = new Section { Secname = "" };
            var result = await _controller.UpdateSection(5, updated);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateSection_SectionIdValid_SecnameValid_ReturnsOk()
        {
            Console.WriteLine(" SectionId = 5, Secname = 'Algebra' → expect OK");

            _context.Sections.Add(new Section { Secid = 5, Secname = "Original", BankId = 1 });
            await _context.SaveChangesAsync();

            var updated = new Section { Secname = "Algebra" };
            var result = await _controller.UpdateSection(5, updated);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
        [Test]
        public async Task DeleteSection_SectionIdNegative_ReturnsNotFound()
        {
            Console.WriteLine(" SectionId = -1 → expect NotFound");
            var result = await _controller.DeleteSection(-1);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteSection_SectionIdZero_ReturnsNotFound()
        {
            Console.WriteLine(" SectionId = 0 → expect NotFound");
            var result = await _controller.DeleteSection(0);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteSection_SectionIdNotExist_ReturnsNotFound()
        {
            Console.WriteLine(" SectionId = 9999 (not exist) → expect NotFound");
            var result = await _controller.DeleteSection(9999);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task DeleteSection_SectionIdValid_ReturnsOk()
        {
            Console.WriteLine(" SectionId = 10 (valid) → expect Ok");

            // 👉 Clear để tránh lỗi key trùng trong InMemoryDatabase
            _context.Banks.RemoveRange(_context.Banks);
            _context.Sections.RemoveRange(_context.Sections);
            _context.SectionHierarchies.RemoveRange(_context.SectionHierarchies);
            await _context.SaveChangesAsync();

            // 👉 Thêm mới Bank không bị trùng
            _context.Banks.Add(new Bank
            {
                BankId = 99,
                Bankname = "Bank",
                GradeId = 1,
                SubjectId = 1,
                CurriculumId = 1,
                Accid = 123
            });
            await _context.SaveChangesAsync();

            var section = new Section
            {
                Secid = 10,
                Secname = "ToDelete",
                BankId = 99
            };
            _context.Sections.Add(section);
            _context.SectionHierarchies.Add(new SectionHierarchy { AncestorId = 10, DescendantId = 10, Depth = 0 });
            await _context.SaveChangesAsync();

            var result = await _controller.DeleteSection(10);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }



    }
}
