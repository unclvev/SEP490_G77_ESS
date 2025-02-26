using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Grade
{
    public long GradeId { get; set; }

    public string? GradeLevel { get; set; }

    public virtual ICollection<Bank> Banks { get; set; } = new List<Bank>();

    public virtual ICollection<Curriculum> Curricula { get; set; } = new List<Curriculum>();
}
