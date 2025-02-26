using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class TypeQuestion
{
    public long TypeId { get; set; }

    public string? TypeName { get; set; }

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}
