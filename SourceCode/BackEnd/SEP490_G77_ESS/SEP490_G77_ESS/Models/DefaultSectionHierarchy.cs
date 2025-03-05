using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class DefaultSectionHierarchy
{
    public long DfSectionId { get; set; }

    public string? DfSectionName { get; set; }

    public string? DfInformation { get; set; }

    public long? CurriculumId { get; set; } // ✅ Thêm CurriculumId

    public virtual Curriculum? Curriculum { get; set; } // ✅ Thêm quan hệ với bảng Curriculum
}
