using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace SEP490_G77_ESS.Models;

public partial class EssDbV11Context : DbContext
{
    public EssDbV11Context()
    {
    }

    public EssDbV11Context(DbContextOptions<EssDbV11Context> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Bank> Banks { get; set; }

    public virtual DbSet<BankAccess> BankAccesses { get; set; }

    public virtual DbSet<BankLogger> BankLoggers { get; set; }

    public virtual DbSet<CorrectAnswer> CorrectAnswers { get; set; }

    public virtual DbSet<Curriculum> Curricula { get; set; }

    public virtual DbSet<DefaultSectionHierarchy> DefaultSectionHierarchies { get; set; }

    public virtual DbSet<Exam> Exams { get; set; }

    public virtual DbSet<Grade> Grades { get; set; }

    public virtual DbSet<Level> Levels { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<Question> Questions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<RolePermission> RolePermissions { get; set; }

    public virtual DbSet<Section> Sections { get; set; }

    public virtual DbSet<SectionHierarchy> SectionHierarchies { get; set; }

    public virtual DbSet<StudentResult> StudentResults { get; set; }

    public virtual DbSet<Subject> Subjects { get; set; }

    public virtual DbSet<TypeAwswerSheet> TypeAwswerSheets { get; set; }

    public virtual DbSet<TypeQuestion> TypeQuestions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=DESKTOP-N81N3JT\\SA;Database=ess_db_v11;uid=sa;pwd=123;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(e => e.AccId).HasName("PK__Account__9A20D554ABC6999A");

            entity.ToTable("Account");

            entity.Property(e => e.AccId).HasColumnName("acc_id");
            entity.Property(e => e.Accname)
                .HasMaxLength(255)
                .HasColumnName("accname");
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.Datejoin)
                .HasColumnType("datetime")
                .HasColumnName("datejoin");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.Gender).HasMaxLength(50);
            entity.Property(e => e.PasswordResetToken).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.ResetTokenExpires).HasColumnType("datetime");
            entity.Property(e => e.Roleid).HasColumnName("roleid");
            entity.Property(e => e.Skill).HasMaxLength(255);
            entity.Property(e => e.Subject).HasMaxLength(100);
            entity.Property(e => e.Username)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("username");
            entity.Property(e => e.Userpass)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("userpass");
            entity.Property(e => e.VerificationToken).HasMaxLength(255);

            entity.HasOne(d => d.Role).WithMany(p => p.Accounts)
                .HasForeignKey(d => d.Roleid)
                .HasConstraintName("FK_Account_Role");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditId).HasName("PK__AuditLog__5AF33E335C400582");

            entity.ToTable("AuditLog");

            entity.Property(e => e.AuditId).HasColumnName("audit_id");
            entity.Property(e => e.Details)
                .HasMaxLength(1000)
                .HasColumnName("details");
            entity.Property(e => e.Operation)
                .HasMaxLength(50)
                .HasColumnName("operation");
            entity.Property(e => e.Operationdate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("operationdate");
            entity.Property(e => e.Performedby)
                .HasColumnType("numeric(38, 0)")
                .HasColumnName("performedby");
            entity.Property(e => e.RecordId).HasColumnName("record_id");
            entity.Property(e => e.Tablename)
                .HasMaxLength(50)
                .HasColumnName("tablename");
        });

        modelBuilder.Entity<Bank>(entity =>
        {
            entity.HasKey(e => e.BankId).HasName("PK__Bank__4076F703FE3403B1");

            entity.ToTable("Bank");

            entity.Property(e => e.BankId).HasColumnName("bank_id");
            entity.Property(e => e.Accid).HasColumnName("accid");
            entity.Property(e => e.Bankname)
                .HasMaxLength(255)
                .HasColumnName("bankname");
            entity.Property(e => e.Bankstatus).HasColumnName("bankstatus");
            entity.Property(e => e.CreateDate)
                .HasColumnType("datetime")
                .HasColumnName("create_date");
            entity.Property(e => e.CurriculumId).HasColumnName("curriculum_id");
            entity.Property(e => e.GradeId).HasColumnName("grade_id");
            entity.Property(e => e.SubjectId).HasColumnName("subject_id");
            entity.Property(e => e.Totalquestion).HasColumnName("totalquestion");

            entity.HasOne(d => d.Acc).WithMany(p => p.Banks)
                .HasForeignKey(d => d.Accid)
                .HasConstraintName("FK_Bank_Account");

            entity.HasOne(d => d.Curriculum).WithMany(p => p.Banks)
                .HasForeignKey(d => d.CurriculumId)
                .HasConstraintName("FK__Bank__curriculum__5FB337D6");

            entity.HasOne(d => d.Grade).WithMany(p => p.Banks)
                .HasForeignKey(d => d.GradeId)
                .HasConstraintName("FK_Bank_Grade");

            entity.HasOne(d => d.Subject).WithMany(p => p.Banks)
                .HasForeignKey(d => d.SubjectId)
                .HasConstraintName("FK_Bank_Subject");
        });

        modelBuilder.Entity<BankAccess>(entity =>
        {
            entity.HasKey(e => e.BankaccessId).HasName("PK__BankAcce__311022BBB09FDBF8");

            entity.ToTable("BankAccess");

            entity.Property(e => e.BankaccessId).HasColumnName("bankaccess_id");
            entity.Property(e => e.Accid).HasColumnName("accid");
            entity.Property(e => e.Bankid).HasColumnName("bankid");
            entity.Property(e => e.Canedit)
                .HasDefaultValue(false)
                .HasColumnName("canedit");
            entity.Property(e => e.Canview)
                .HasDefaultValue(false)
                .HasColumnName("canview");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .HasColumnName("role");

            entity.HasOne(d => d.Acc).WithMany(p => p.BankAccesses)
                .HasForeignKey(d => d.Accid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BankAccess_Account");

            entity.HasOne(d => d.Bank).WithMany(p => p.BankAccesses)
                .HasForeignKey(d => d.Bankid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BankAccess_Bank");
        });

        modelBuilder.Entity<BankLogger>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK__BankLogg__9E2397E06367129A");

            entity.ToTable("BankLogger");

            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.BankId).HasColumnName("bank_id");
            entity.Property(e => e.Logmessage)
                .HasMaxLength(200)
                .HasColumnName("logmessage");
            entity.Property(e => e.Logtime)
                .HasColumnType("datetime")
                .HasColumnName("logtime");

            entity.HasOne(d => d.Bank).WithMany(p => p.BankLoggers)
                .HasForeignKey(d => d.BankId)
                .HasConstraintName("FK_BankLogger_Bank");
        });

        modelBuilder.Entity<CorrectAnswer>(entity =>
        {
            entity.HasKey(e => e.AnsId).HasName("PK__Correct___24F9FB178B81FAE2");

            entity.ToTable("Correct_Answer");

            entity.Property(e => e.AnsId).HasColumnName("ans_id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.Quesid).HasColumnName("quesid");

            entity.HasOne(d => d.Ques).WithMany(p => p.CorrectAnswers)
                .HasForeignKey(d => d.Quesid)
                .HasConstraintName("FK_Correct_Answer_Question");
        });

        modelBuilder.Entity<Curriculum>(entity =>
        {
            entity.HasKey(e => e.CurriculumId).HasName("PK__Curricul__17583C76CD239856");

            entity.ToTable("Curriculum");

            entity.Property(e => e.CurriculumId).HasColumnName("curriculum_id");
            entity.Property(e => e.CurriculumName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("curriculum_name");
            entity.Property(e => e.DfSectionId).HasColumnName("df_section_id");
            entity.Property(e => e.GradeId).HasColumnName("grade_id");
            entity.Property(e => e.SubjectId).HasColumnName("subject_id");

            entity.HasOne(d => d.Grade).WithMany(p => p.Curricula)
                .HasForeignKey(d => d.GradeId)
                .HasConstraintName("FK_Curriculum_Grade");

            entity.HasOne(d => d.Subject).WithMany(p => p.Curricula)
                .HasForeignKey(d => d.SubjectId)
                .HasConstraintName("FK_Curriculum_Subject");
        });

        modelBuilder.Entity<DefaultSectionHierarchy>(entity =>
        {
            entity.HasKey(e => e.DfSectionId).HasName("PK__Default___81C01AEA71540B0B");

            entity.ToTable("Default_Section_Hierarchy");

            entity.Property(e => e.DfSectionId).HasColumnName("df_section_id");
            entity.Property(e => e.AncestorId).HasColumnName("ancestor_id");
            entity.Property(e => e.CurriculumId).HasColumnName("curriculum_id");
            entity.Property(e => e.Depth).HasColumnName("depth");
            entity.Property(e => e.DescendantId).HasColumnName("descendant_id");
            entity.Property(e => e.DfInformation).HasColumnName("df_information");
            entity.Property(e => e.DfSectionName)
                .HasMaxLength(255)
                .HasColumnName("df_section_name");
            entity.Property(e => e.GradeId).HasColumnName("grade_id");
            entity.Property(e => e.SubjectId).HasColumnName("subject_id");

            entity.HasOne(d => d.Curriculum).WithMany(p => p.DefaultSectionHierarchies)
                .HasForeignKey(d => d.CurriculumId)
                .HasConstraintName("FK__Default_S__curri__693CA210");
        });

        modelBuilder.Entity<Exam>(entity =>
        {
            entity.HasKey(e => e.ExamId).HasName("PK__Exam__9C8C7BE9B67369B9");

            entity.ToTable("Exam");

            entity.Property(e => e.ExamId).HasColumnName("exam_id");
            entity.Property(e => e.AccId).HasColumnName("acc_id");
            entity.Property(e => e.Classname)
                .HasMaxLength(50)
                .HasColumnName("classname");
            entity.Property(e => e.Createdate)
                .HasColumnType("datetime")
                .HasColumnName("createdate");
            entity.Property(e => e.ExamType)
                .HasMaxLength(50)
                .HasColumnName("exam_type");
            entity.Property(e => e.Examdata).HasColumnName("examdata");
            entity.Property(e => e.Examname)
                .HasMaxLength(50)
                .HasColumnName("examname");
            entity.Property(e => e.Grade)
                .HasMaxLength(50)
                .HasColumnName("grade");
            entity.Property(e => e.Subject)
                .HasMaxLength(50)
                .HasColumnName("subject");

            entity.HasOne(d => d.Acc).WithMany(p => p.Exams)
                .HasForeignKey(d => d.AccId)
                .HasConstraintName("FK_Exam_Account");
        });

        modelBuilder.Entity<Grade>(entity =>
        {
            entity.HasKey(e => e.GradeId).HasName("PK__Grade__3A8F732CC14C4362");

            entity.ToTable("Grade");

            entity.Property(e => e.GradeId).HasColumnName("grade_id");
            entity.Property(e => e.GradeLevel)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("grade_level");
        });

        modelBuilder.Entity<Level>(entity =>
        {
            entity.HasKey(e => e.LevelId).HasName("PK__Level__034616432CC96552");

            entity.ToTable("Level");

            entity.Property(e => e.LevelId).HasColumnName("level_id");
            entity.Property(e => e.Levelname)
                .HasMaxLength(100)
                .HasColumnName("levelname");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.PermissionId).HasName("PK__Permissi__E5331AFA4E79D43F");

            entity.ToTable("Permission");

            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.PermissionName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("permission_name");
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Quesid).HasName("PK__Question__8FF5F51D1070C3D5");

            entity.ToTable("Question");

            entity.Property(e => e.Quesid).HasColumnName("quesid");
            entity.Property(e => e.AnswerContent).HasColumnName("answer_content");
            entity.Property(e => e.DfSectionId).HasColumnName("df_section_id");
            entity.Property(e => e.Modeid).HasColumnName("modeid");
            entity.Property(e => e.Quescontent).HasColumnName("quescontent");
            entity.Property(e => e.Secid).HasColumnName("secid");
            entity.Property(e => e.Solution).HasColumnName("solution");
            entity.Property(e => e.TypeId).HasColumnName("type_id");

            entity.HasOne(d => d.Mode).WithMany(p => p.Questions)
                .HasForeignKey(d => d.Modeid)
                .HasConstraintName("FK_Question_Level");

            entity.HasOne(d => d.Sec).WithMany(p => p.Questions)
                .HasForeignKey(d => d.Secid)
                .HasConstraintName("FK_Question_Section");

            entity.HasOne(d => d.Type).WithMany(p => p.Questions)
                .HasForeignKey(d => d.TypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Question_Type");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.RefreshTokenId).HasName("PK__RefreshT__B0A1F7C7BED8EF15");

            entity.ToTable("RefreshToken");

            entity.Property(e => e.RefreshTokenId).HasColumnName("refresh_token_id");
            entity.Property(e => e.AccountId).HasColumnName("account_id");
            entity.Property(e => e.Created)
                .HasColumnType("datetime")
                .HasColumnName("created");
            entity.Property(e => e.Expires)
                .HasColumnType("datetime")
                .HasColumnName("expires");
            entity.Property(e => e.Revoked)
                .HasColumnType("datetime")
                .HasColumnName("revoked");
            entity.Property(e => e.Token)
                .HasMaxLength(255)
                .HasColumnName("token");

            entity.HasOne(d => d.Account).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RefreshToken_Account");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Role__760965CC5FD138B4");

            entity.ToTable("Role");

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.RoleName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("role_name");
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RolePerm__3213E83FE9B6A85C");

            entity.ToTable("RolePermission");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FunctionName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("function_name");
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");

            entity.HasOne(d => d.Permission).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.PermissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RolePermission_Permission");

            entity.HasOne(d => d.Role).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RolePermission_Role");
        });

        modelBuilder.Entity<Section>(entity =>
        {
            entity.HasKey(e => e.Secid).HasName("PK__Section__C25197F0001A9580");

            entity.ToTable("Section");

            entity.Property(e => e.Secid).HasColumnName("secid");
            entity.Property(e => e.BankId).HasColumnName("bank_id");
            entity.Property(e => e.Secname)
                .HasMaxLength(100)
                .HasColumnName("secname");

            entity.HasOne(d => d.Bank).WithMany(p => p.Sections)
                .HasForeignKey(d => d.BankId)
                .HasConstraintName("FK_Section_Bank");
        });

        modelBuilder.Entity<SectionHierarchy>(entity =>
        {
            entity.HasKey(e => e.SectionHierarchyId).HasName("PK__SectionH__2983E0FF2494E255");

            entity.ToTable("SectionHierarchy");

            entity.Property(e => e.SectionHierarchyId).HasColumnName("section_hierarchy_id");
            entity.Property(e => e.AncestorId).HasColumnName("ancestor_id");
            entity.Property(e => e.Depth).HasColumnName("depth");
            entity.Property(e => e.DescendantId).HasColumnName("descendant_id");

            entity.HasOne(d => d.Ancestor).WithMany(p => p.SectionHierarchyAncestors)
                .HasForeignKey(d => d.AncestorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SectionHierarchy_Ancestor");

            entity.HasOne(d => d.Descendant).WithMany(p => p.SectionHierarchyDescendants)
                .HasForeignKey(d => d.DescendantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SectionHierarchy_Descendant");
        });

        modelBuilder.Entity<StudentResult>(entity =>
        {
            entity.HasKey(e => e.StudentResultId).HasName("PK__student___6888BE428A952BFB");

            entity.ToTable("student_result");

            entity.Property(e => e.StudentResultId).HasColumnName("student_result_id");
            entity.Property(e => e.CreateDate)
                .HasColumnType("datetime")
                .HasColumnName("create_date");
            entity.Property(e => e.ExamCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("exam_code");
            entity.Property(e => e.ExamId).HasColumnName("exam_id");
            entity.Property(e => e.Gender).HasColumnName("gender");
            entity.Property(e => e.Rank).HasColumnName("rank");
            entity.Property(e => e.Score).HasColumnName("score");
            entity.Property(e => e.StudentCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("student_code");
            entity.Property(e => e.StudentDob)
                .HasColumnType("datetime")
                .HasColumnName("student_dob");
            entity.Property(e => e.StudentName)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("student_name");
            entity.Property(e => e.StudentQrCodes)
                .HasColumnType("text")
                .HasColumnName("student_qr_codes");

            entity.HasOne(d => d.Exam).WithMany(p => p.StudentResults)
                .HasForeignKey(d => d.ExamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_result_examl");
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasKey(e => e.SubjectId).HasName("PK__Subject__5004F66064596D34");

            entity.ToTable("Subject");

            entity.Property(e => e.SubjectId).HasColumnName("subject_id");
            entity.Property(e => e.SubjectName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("subject_name");
        });

        modelBuilder.Entity<TypeAwswerSheet>(entity =>
        {
            entity.HasKey(e => e.TypeAnswerSheetId).HasName("PK__Type_Aws__E7464B659264BDB9");

            entity.ToTable("Type_Awswer_Sheet");

            entity.Property(e => e.TypeAnswerSheetId).HasColumnName("type_answer_sheet_id");
            entity.Property(e => e.TypeAnswerSheetName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("type_answer_sheet_name");
        });

        modelBuilder.Entity<TypeQuestion>(entity =>
        {
            entity.HasKey(e => e.TypeId).HasName("PK__Type_Que__2C0005981B80D528");

            entity.ToTable("Type_Question");

            entity.Property(e => e.TypeId).HasColumnName("type_id");
            entity.Property(e => e.TypeName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("type_name");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
