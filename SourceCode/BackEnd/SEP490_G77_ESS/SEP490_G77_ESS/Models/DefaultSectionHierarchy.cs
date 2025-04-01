 using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class DefaultSectionHierarchy
{
    public long DfSectionId { get; set; }

    public string? DfSectionName { get; set; }

    public string? DfInformation { get; set; }

    public long? CurriculumId { get; set; }

    public long? GradeId { get; set; }

    public long? SubjectId { get; set; }

    public long? AncestorId { get; set; }

    public long? DescendantId { get; set; }

    public long? Depth { get; set; }

    public virtual Curriculum? Curriculum { get; set; }
}
