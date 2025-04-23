using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Bank
{
    public long BankId { get; set; }

    public string? Bankname { get; set; }

    public byte? Bankstatus { get; set; }

    public long? Totalquestion { get; set; }

    public long? Accid { get; set; }

    public long? GradeId { get; set; }

    public long? SubjectId { get; set; }

    public DateTime? CreateDate { get; set; }

    public long? CurriculumId { get; set; }

    public virtual Account? Acc { get; set; }

    public virtual ICollection<BankAccess> BankAccesses { get; set; } = new List<BankAccess>();

    public virtual ICollection<BankLogger> BankLoggers { get; set; } = new List<BankLogger>();

    public virtual Curriculum? Curriculum { get; set; }

    public virtual Grade? Grade { get; set; }

    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();

    public virtual Subject? Subject { get; set; }
}
