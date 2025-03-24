namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class BexDTO
    {
        public long BankId { get; set; }
        public string? BankName { get; set; }
        public byte? BankStatus { get; set; }
        public long? TotalQuestion { get; set; }
        public long? AccId { get; set; }
        public long? GradeId { get; set; }
        public string? GradeLevel { get; set; }
        public long? SubjectId { get; set; }
        public string? SubjectName { get; set; }
        public long? CurriculumId { get; set; }
        public string? CurriculumName { get; set; }
        public DateTime? CreateDate { get; set; }
        public List<BexSectionDTO> Sections { get; set; } = new();
    }

    public class BexSectionDTO
    {
        public long SecId { get; set; }
        public string? SecName { get; set; }
        public long? BankId { get; set; }
        public List<BexSectionHierarchyDTO> Ancestors { get; set; } = new();
        public List<BexSectionHierarchyDTO> Descendants { get; set; } = new();
    }

    public class BexSectionHierarchyDTO
    {
        public long SectionHierarchyId { get; set; }
        public long AncestorId { get; set; }
        public long DescendantId { get; set; }
        public long Depth { get; set; }
    }

    public class Bexs
    {
        public string BankName { get; set; }
        public long BankId { get; set; }
    }
}
