using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Exam
{
    public long ExamId { get; set; }

    public string? Examname { get; set; }

    public DateTime? Createdate { get; set; }

    public long? AccId { get; set; }

    public string? Examdata { get; set; }

    public string? Grade { get; set; }

    public string? Subject { get; set; }

    public string? Classname { get; set; }

    public string? ExamType { get; set; }

    public virtual Account? Acc { get; set; }

    public virtual ICollection<StudentResult> StudentResults { get; set; } = new List<StudentResult>();
}
