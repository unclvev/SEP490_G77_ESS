using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using System.Security.Claims;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Controllers.RBAC.Bank;
using System.Collections.Generic;
using System.Linq;
using SEP490_G77_ESS.DTO.RBAC.Bank;

namespace SEP490_G77_ESS.Tests.Controller.PermissonRole
{
    [TestFixture]
    public class ManagerControllerTests
    {
        private EssDbV11Context _context;
        private ManagerController _controller;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_Manager")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _context.Accounts.AddRange(
                new Account { AccId = 1, Email = "test@example.com", Phone = "0123456789", Username = "User1" },
                new Account { AccId = 2, Email = "other@example.com", Phone = "0987654321", Username = "User2" }
            );

            _context.Banks.Add(new Bank
            {
                BankId = 100,
                Accid = 1,
                Bankname = "Test Bank"
            });

            _context.SaveChanges();

            _controller = new ManagerController(_context);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("AccId", "1")
                    }, "TestAuth"))
                }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        // --- Tests for GetUsers ---

        [Test]
        public async Task GetUsers_SearchEmpty_ReturnsBadRequest()
        {
            Console.WriteLine("GetUsers failed – empty search");
            var result = await _controller.GetUsers("");
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetUsers_NoMatchingUser_ReturnsOkEmptyList()
        {
            Console.WriteLine("GetUsers success – 0 users");
            var result = await _controller.GetUsers("notfound");
            var okResult = result as OkObjectResult;

            Assert.That(okResult, Is.Not.Null);
            var users = okResult.Value as List<GetUserDTO>;
            Assert.That(users, Is.Not.Null);
            Assert.That(users.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetUsers_MatchingUser_ReturnsOkWithUsers()
        {
            Console.WriteLine("GetUsers success – found users");
            var result = await _controller.GetUsers("test");
            var okResult = result as OkObjectResult;

            Assert.That(okResult, Is.Not.Null);
            var users = okResult.Value as List<GetUserDTO>;
            Assert.That(users, Is.Not.Null);
            Assert.That(users.Count, Is.GreaterThan(0));
        }

        // --- Tests for InviteUser ---

        [Test]
        public async Task InviteUser_MissingClaim_ReturnsUnauthorized()
        {
            Console.WriteLine("InviteUser failed – missing claim");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

            var result = await _controller.InviteUser(new InviteUserRequest());
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task InviteUser_BankNotFound_ReturnsNotFound()
        {
            Console.WriteLine("InviteUser failed – bank not found");
            var request = new InviteUserRequest
            {
                Resource = new ResourceDto { ResourceId = 9999, ResourceType = "Bank", Accid = 2 },
                AccessRole = new AccessRoleDto { RoleName = "Viewer", CanRead = true, CanModify = false, CanDelete = false }
            };

            var result = await _controller.InviteUser(request);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task InviteUser_AlreadyInvited_ReturnsConflict()
        {
            Console.WriteLine("InviteUser failed – already invited");
            _context.ResourceAccesses.Add(new ResourceAccess { ResourceId = 100, ResourceType = "Bank", Accid = 2 });
            _context.SaveChanges();

            var request = new InviteUserRequest
            {
                Resource = new ResourceDto { ResourceId = 100, ResourceType = "Bank", Accid = 2 },
                AccessRole = new AccessRoleDto { RoleName = "Viewer", CanRead = true, CanModify = false, CanDelete = false }
            };

            var result = await _controller.InviteUser(request);
            Assert.That(result, Is.TypeOf<ConflictObjectResult>());
        }

        [Test]
        public async Task InviteUser_ValidRequest_ReturnsOk()
        {
            Console.WriteLine("InviteUser success");
            var request = new InviteUserRequest
            {
                Resource = new ResourceDto { ResourceId = 100, ResourceType = "Bank", Accid = 2 },
                AccessRole = new AccessRoleDto { RoleName = "Editor", CanRead = true, CanModify = true, CanDelete = false }
            };

            var result = await _controller.InviteUser(request);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        // --- Tests for GetInvitedUsers ---

        [Test]
        public async Task GetInvitedUsers_MissingClaim_ReturnsUnauthorized()
        {
            Console.WriteLine("GetInvitedUsers failed – missing claim");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

            var result = await _controller.GetInvitedUsers(100, "Bank");
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetInvitedUsers_NotOwner_ReturnsUnauthorized()
        {
            Console.WriteLine("GetInvitedUsers failed – unauthorized access");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("AccId", "2")
            }, "TestAuth"));

            var result = await _controller.GetInvitedUsers(100, "Bank");
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task GetInvitedUsers_NoInvitedUsers_ReturnsOkEmpty()
        {
            Console.WriteLine("GetInvitedUsers success – 0 users for bank");

            var result = await _controller.GetInvitedUsers(100, "Bank");

            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            dynamic invited = okResult.Value;
            Assert.That(invited, Is.Not.Null);
            Assert.That(((IEnumerable<object>)invited).Count(), Is.EqualTo(0));
        }



        [Test]
        public async Task GetInvitedUsers_HasInvitedUsers_ReturnsOk()
        {
            Console.WriteLine("GetInvitedUsers success – users found");

            var role = new RoleAccess { RoleName = "Viewer", CanRead = true, CanModify = false, CanDelete = false };
            _context.RoleAccesses.Add(role);
            await _context.SaveChangesAsync();

            _context.ResourceAccesses.Add(new ResourceAccess
            {
                ResourceId = 100,
                ResourceType = "Bank",
                Accid = 2,
                RoleId = role.Roleid
            });
            await _context.SaveChangesAsync();

            var result = await _controller.GetInvitedUsers(100, "Bank");

            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            dynamic invited = okResult.Value;
            Assert.That(invited, Is.Not.Null);
            Assert.That(((IEnumerable<object>)invited).Count(), Is.GreaterThan(0));
        }




        // --- Tests for UpdateRole ---

        [Test]
        public async Task UpdateRole_MissingClaim_ReturnsUnauthorized()
        {
            Console.WriteLine("UpdateRole failed – missing claim");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

            var result = await _controller.UpdateRole(100, 2, new UpdateRoleDTO());
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task UpdateRole_NotOwner_ReturnsUnauthorized()
        {
            Console.WriteLine("UpdateRole failed – unauthorized access");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("AccId", "2")
            }, "TestAuth"));

            var result = await _controller.UpdateRole(100, 2, new UpdateRoleDTO());
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task UpdateRole_ResourceNotFound_ReturnsNotFound()
        {
            Console.WriteLine("UpdateRole failed – resource not found");
            var result = await _controller.UpdateRole(100, 99, new UpdateRoleDTO());
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateRole_ValidUpdate_ReturnsOk()
        {
            Console.WriteLine("UpdateRole success");

            // ⚡ Seed bank
            _context.Banks.Add(new Bank { BankId = 1, Accid = 1, Bankname = "Bank1" });

            // ⚡ Seed ResourceAccess + RoleAccess
            var role = new RoleAccess { RoleName = "OldRole", CanRead = false, CanModify = false, CanDelete = false };
            _context.RoleAccesses.Add(role);
            await _context.SaveChangesAsync();

            _context.ResourceAccesses.Add(new ResourceAccess
            {
                ResourceId = 1,
                ResourceType = "Bank",
                Accid = 2,
                RoleId = role.Roleid
            });

            await _context.SaveChangesAsync();

            var updateDto = new UpdateRoleDTO
            {
                RoleName = "NewEditor",
                CanRead = true,
                CanModify = true,
                CanDelete = false
            };

            var result = await _controller.UpdateRole(1, 2, updateDto);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }


        // --- Tests for RemoveUser ---

        [Test]
        public async Task RemoveUser_MissingClaim_ReturnsUnauthorized()
        {
            Console.WriteLine("RemoveUser failed – missing claim");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

            var result = await _controller.RemoveUser(100, 2);
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task RemoveUser_NotOwner_ReturnsUnauthorized()
        {
            Console.WriteLine("RemoveUser failed – unauthorized access");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("AccId", "2")
            }, "TestAuth"));

            var result = await _controller.RemoveUser(100, 2);
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task RemoveUser_ResourceNotFound_ReturnsNotFound()
        {
            Console.WriteLine("RemoveUser failed – resource not found");
            var result = await _controller.RemoveUser(100, 99);
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task RemoveUser_ValidRemoval_ReturnsOk()
        {
            Console.WriteLine("RemoveUser success");
            _context.ResourceAccesses.Add(new ResourceAccess { ResourceId = 100, ResourceType = "Bank", Accid = 2 });
            _context.SaveChanges();

            var result = await _controller.RemoveUser(100, 2);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
    }
}
