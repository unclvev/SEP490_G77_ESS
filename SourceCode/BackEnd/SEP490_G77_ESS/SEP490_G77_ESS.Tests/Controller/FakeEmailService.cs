using SEP490_G77_ESS.Services;
using System;
using System.Threading.Tasks;

public class FakeEmailService : EmailService
{
    public FakeEmailService() : base(null) { }

    public override Task SendVerificationEmailAsync(string toEmail, string verificationLink)
    {
        Console.WriteLine($"Fake send email to {toEmail} with link {verificationLink}");
        return Task.CompletedTask;
    }
}
