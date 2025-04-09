namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class ExamSection3TDTO
    {
        // Id của phần thi
        public int SectionId { get; set; }

        // Loại câu hỏi
        public int TypeId { get; set; }

        // Các số lượng câu hỏi theo độ khó
        public CountsDTO Counts { get; set; }
    }

    public class CountsDTO
    {
        // Số câu hỏi Easy
        public int Easy { get; set; }

        // Số câu hỏi Medium
        public int Medium { get; set; }

        // Số câu hỏi Hard
        public int Hard { get; set; }
    }
}
