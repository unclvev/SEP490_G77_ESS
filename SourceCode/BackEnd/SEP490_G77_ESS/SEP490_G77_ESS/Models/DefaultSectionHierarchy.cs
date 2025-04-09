 using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models
{
    public partial class DefaultSectionHierarchy
    {
        public long DfSectionId { get; set; }

        public string? DfSectionName { get; set; }

        public string? DfInformation { get; set; }

        public long? CurriculumId { get; set; }
        public long? GradeId { get; set; }
        public long? SubjectId { get; set; }

        public long? AncestorId { get; set; }  // ✅ Thêm quan hệ cha
        public long? DescendantId { get; set; }  // ✅ Thêm quan hệ con
        public int? Depth { get; set; }  // ✅ Độ sâu của section

        public virtual Curriculum? Curriculum { get; set; }
        public virtual Grade? Grade { get; set; }
        public virtual Subject? Subject { get; set; }
    }
}
