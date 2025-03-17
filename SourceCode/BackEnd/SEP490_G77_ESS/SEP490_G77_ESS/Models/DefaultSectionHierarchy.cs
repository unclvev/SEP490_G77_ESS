using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class DefaultSectionHierarchy
{
    public long DfSectionId { get; set; }

    public string? DfSectionName { get; set; }

    public string? DfInformation { get; set; }

    public long? CurriculumId { get; set; }
    public long? GradeId { get; set; }  // Thêm vào
    public long? SubjectId { get; set; } // Thêm vào

    // Các navigation properties tương ứng
    public virtual Curriculum? Curriculum { get; set; }
    public virtual Grade? Grade { get; set; } // Thêm vào
    public virtual Subject? Subject { get; set; } // Thêm vào
}
