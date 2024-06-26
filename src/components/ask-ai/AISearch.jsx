import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import Markdown from "markdown-to-jsx";
import { FaSpinner } from "react-icons/fa";
import { List, Space } from "antd";
import "./css/AISearch.css";

const AISearch = forwardRef((props, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [isAnswerComplete, setIsAnswerComplete] = useState(false);
  const [termSelected, setTermSelected] = useState(false);
  const [sources, setSources] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const commonSearchQueries = [
    "What is Shesha?",
    "What version of Node do I need installed?",
    "How do I validate a South African phone number?",
    "How do I filter with dynamic properties or input?",
    "How do I see which properties are exposed for a on a code editor?",
  ];

  const resetState = () => {
    setInputValue("");
    setSearchTerm("");
    setAnswer("");
    setIsLoading(false);
    setShowExamples(true);
    setTermSelected(false);
    setIsAnswerComplete(false);
    setChatHistory([]);
  };

  const resetGeneratedResponse = () => {
    setAnswer("");
    setIsLoading(false);
    setShowExamples(false);
    setTermSelected(false);
    setIsAnswerComplete(false);
  };

  const allowToAddAnotherRequest = () => {
    setIsLoading(false);
    setShowExamples(false);
    setTermSelected(false);
    setIsAnswerComplete(false);
  };

  const closeModal = () => {
    if (props.closeModal) {
      props.closeModal();
    }
    setTermSelected(false);
    setAnswer("");
    setIsLoading(false);
    setShowExamples(true);
  };

  useImperativeHandle(ref, () => ({
    resetModal: () => {
      resetState();
      closeModal();
    },
    closeModal,
  }));

  const fetchData = async (query) => {
    setIsLoading(true);
    setAnswer("");
    setSearchTerm(query);
    setShowExamples(false);
    setIsAnswerComplete(false);
    // setUserSearchTerm(query);
    // registerAISearch(query);
    const newChatHistory = [...chatHistory, { user: query }];
    const updatedChatHistory = newChatHistory.slice(-3);
    setChatHistory(updatedChatHistory);

    try {
      const apiUrl = "botsa.azurewebsites.net/shesha_ai";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userinput: query,
          chathistory: JSON.stringify(updatedChatHistory),
          index_name: "shesha"
        }),
      });

      console.log("response", response)

      if (response.ok) {
        const data = await response.json();
        console.log(`AI response: ${data.message.response_message}`);
        setIsLoading(false);
        setAnswer(data.message.response_message);
        setSources(data.message.source);
        setIsAnswerComplete(true);
        setInputValue("");
        setSearchTerm("");
        const nextChatHistory = [...updatedChatHistory, { sheshaAI: data.message.response_message }];

        if (nextChatHistory.length > 3) {
          setChatHistory(nextChatHistory.slice(-3));
        } else {
          setChatHistory(nextChatHistory);
        }

        return;
      }

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        setIsLoading(false);
        setAnswer("Sorry, I don't know how to help with that.");
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setAnswer("Sorry, I don't know how to help with that.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isLoading) {
        fetchData(inputValue);
        if (isAnswerComplete) {
          resetGeneratedResponse();
        }
      }
    }
  };

  const handleChange = (e) => {
    if (!isLoading) {
      setInputValue(e.target.value);
      if (isAnswerComplete) {
        allowToAddAnotherRequest();
      }
    }
  };

  const handleCommonQueryClick = (query) => {
    if (!isLoading) {
      setTermSelected(true);
      fetchData(query);
    }
  };

  useEffect(() => {
    if (ExecutionEnvironment.canUseDOM) {
      const resultContainer = document.querySelector(".ai-result-container");
      const handleScroll = () => {
        resultContainer.classList.add("scrolled");
      };
      if (!resultContainer.classList.contains("scrolled"))
        document.addEventListener("scroll", handleScroll);

      return () => {
        document.removeEventListener("scroll", handleScroll);
        resultContainer.classList.remove("scrolled");
      };
    }
  }, []);

  return (
    <div className="ai-search-result-wrapper">
      <header className="ai-search-bar-header">
        <div className="custom-search-container">
          <img src="../../../img/ask-ai-robot-icon.svg" alt="Ask AI"></img>
          <input
            id="question-input"
            name="question-input"
            placeholder="What is Shesha?"
            type="text"
            value={termSelected ? searchTerm : inputValue}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            disabled={isLoading && !isAnswerComplete}
          />
          <span className="ai-submit-message">Submit message</span>
          <img src="../../../img/ai-enter-icon.svg" alt="Enter"></img>
        </div>
      </header>
      {isLoading && (
        <div className="loading-icon-container">
          <FaSpinner className="loading-icon" />
          <span className="ai-loading-time-info">
            AI generated responses can take upto a minute.
          </span>
        </div>
      )}
      <div className="ai-result-container">
        {showExamples && (
          <div className="ai-query-wrapper">
            <span className="ai-query-heading">Examples</span>
            {showExamples &&
              commonSearchQueries.map((query, index) => (
                <span
                  key={index}
                  className="ai-search-term"
                  onClick={() => handleCommonQueryClick(query)}
                >
                  {query}
                </span>
              ))}
          </div>
        )}
        {!isLoading && answer && (
          <div className="search-term-answer">
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Markdown>{answer}</Markdown>
            <p style={{color: 'grey'}}>Sources:</p>
            <div>
              <List
                bordered
                dataSource={sources}
                renderItem={(item) => (
                  <List.Item>
                    <a href={item} style={{fontSize: '12px'}}>{item}</a>
                  </List.Item>
                )}
              />
            </div>
            </Space>
          </div>
        )}
        {isAnswerComplete && (
          <div className="ai-experimental">
            <span className="ai-experimental-info">
              Shesha AI is experiemental and may produce incorrect answers.
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default AISearch;
