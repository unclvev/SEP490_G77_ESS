using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Level
{
    public long LevelId { get; set; }

    public string? Levelname { get; set; }

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}
