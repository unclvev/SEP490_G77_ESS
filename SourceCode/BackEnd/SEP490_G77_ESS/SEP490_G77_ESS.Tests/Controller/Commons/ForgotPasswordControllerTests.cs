using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using SEP490_G77_ESS.Controllers.Common;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;
using SEP490_G77_ESS.Utils;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Tests.Controller.Commons
{
    [TestFixture]
    public class ForgotPasswordControllerTests
    {
        private EssDbV11Context _context;
        private ForgotPasswordController _controller;
        private PasswordHandler _passwordHandler;
        private FakeEmailService _fakeEmailService;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_ForgotPassword")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _passwordHandler = new PasswordHandler();
            _fakeEmailService = new FakeEmailService();

            _controller = new ForgotPasswordController(_context, _fakeEmailService, _passwordHandler);

            _context.Accounts.Add(new Account
            {
                AccId = 1,
                Email = "user@example.com",
                Username = "TestUser",
                Userpass = _passwordHandler.HashPassword("password123"),
                Phone = "0123456789",
                Datejoin = DateTime.Now.AddYears(-20)
            });
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            _controller.ControllerContext.HttpContext.Request.Scheme = "http";
            _controller.ControllerContext.HttpContext.Request.Host = new HostString("localhost");

            _context.SaveChanges();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task ForgotPassword_NoEmailProvided_ReturnsBadRequest()
        {
            Console.WriteLine("Forgot password failed - empty email");

            var result = await _controller.ForgotPassword(string.Empty);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ForgotPassword_EmailNotExist_ReturnsNotFound()
        {
            Console.WriteLine("Forgot password failed - email not found: notfound@example.com");

            var result = await _controller.ForgotPassword("notfound@example.com");

            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task ForgotPassword_InvalidEmailFormat_ReturnsBadRequest()
        {
            Console.WriteLine("Forgot password failed - invalid email format: invalid_email");

            var result = await _controller.ForgotPassword("invalid_email");

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ForgotPassword_ValidEmailReset_ReturnsOk()
        {
            Console.WriteLine("Forgot password success - reset email sent to user@example.com");

            var result = await _controller.ForgotPassword("user@example.com");

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
    }
}
