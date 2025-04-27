using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class StudentResult
{
    public long StudentResultId { get; set; }

    public string? ExamCode { get; set; }

    public long ExamId { get; set; }

    public double? Score { get; set; }

    public string? StudentCode { get; set; }

    public string? StudentName { get; set; }

    public bool? Gender { get; set; }

    public DateTime? StudentDob { get; set; }

    public string? StudentQrCodes { get; set; }

    public long Rank { get; set; }

    public DateTime? CreateDate { get; set; }

    public virtual Exam Exam { get; set; } = null!;
}
