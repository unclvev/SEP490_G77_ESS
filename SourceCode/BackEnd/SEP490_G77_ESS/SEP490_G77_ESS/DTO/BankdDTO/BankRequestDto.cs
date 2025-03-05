namespace SEP490_G77_ESS.DTO.BankdDTO
{
    public class BankRequestDto
    {
        public long? GradeId { get; set; }
        public long? SubjectId { get; set; }
        public long? CurriculumId { get; set; }
        public List<SectionDto>? Sections { get; set; }
    }
}
