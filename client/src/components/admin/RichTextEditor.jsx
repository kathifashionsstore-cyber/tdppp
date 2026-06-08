import ReactQuill from 'react-quill';

const modules = {
  toolbar: [['bold', 'italic', 'underline'], [{ header: [2, 3, false] }], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
};

const RichTextEditor = ({ value, onChange, placeholder }) => (
  <ReactQuill theme="snow" value={value || ''} onChange={onChange} modules={modules} placeholder={placeholder} className="bg-white" />
);

export default RichTextEditor;
