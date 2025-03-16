using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Curriculum
{
    public long CurriculumId { get; set; }

    public string? CurriculumName { get; set; }

    public long? SubjectId { get; set; }

    public long? GradeId { get; set; }

    public long? DfSectionId { get; set; }

    public virtual ICollection<Bank> Banks { get; set; } = new List<Bank>();

    public virtual ICollection<DefaultSectionHierarchy> DefaultSectionHierarchies { get; set; } = new List<DefaultSectionHierarchy>();

    public virtual Grade? Grade { get; set; }

    public virtual Subject? Subject { get; set; }
}
