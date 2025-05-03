import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  List,
  Card,
  Select,
  Input,
  Radio,
  message,
  Popconfirm,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  EditorState,
  ContentState,
  convertToRaw,
  Modifier,
  SelectionState,
} from "draft-js";
import parse from "html-react-parser";
import axios from "axios";
import { toast } from "react-toastify";
import { Editor } from "react-draft-wysiwyg";
import { stateToHTML } from "draft-js-export-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { stateFromHTML } from "draft-js-import-html";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { Modal } from "antd";
import { useRef } from "react";
import {
  getQuestions,
  getQuestionTypes,
  getLevels,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadImageBase64,
  importQuestionExcel,
  exportQuestionsExcel,
} from "../../services/api";

const UpdateQuestionModal = ({}) => {
  const [questionTypes, setQuestionTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  
};

export default UpdateQuestionModal;
