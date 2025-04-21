using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Account
{
    public long AccId { get; set; }

    public string? Username { get; set; }

    public string? Userpass { get; set; }

    public string? Accname { get; set; }

    public string? Email { get; set; }

    public DateTime? Datejoin { get; set; }

    public DateTime? Dob { get; set; }

    public string? Gender { get; set; }

    public string? Subject { get; set; }

    public string? Address { get; set; }

    public string? Skill { get; set; }

    public string? Phone { get; set; }

    public string? PasswordResetToken { get; set; }

    public DateTime? ResetTokenExpires { get; set; }

    public string? VerificationToken { get; set; }

    public int? IsActive { get; set; }

    public virtual ICollection<Bank> Banks { get; set; } = new List<Bank>();

    public virtual ICollection<Exam> Exams { get; set; } = new List<Exam>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<ResourceAccess> ResourceAccesses { get; set; } = new List<ResourceAccess>();
}
